const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

const mapAppointment = row => ({
  id: row.id,
  dogName: row.dog_name,
  phone: row.phone || '',
  email: row.email || '',
  ownerName: row.owner_name || '',
  breed: row.breed || '',
  service: row.service,
  date: row.appointment_date,
  time: String(row.appointment_time).slice(0, 5),
  status: row.status,
  createdAt: row.created_at
});

module.exports = async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ error: 'DATABASE_URL is not configured.' });
    }

    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS owner_name TEXT, ADD COLUMN IF NOT EXISTS breed TEXT`;

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, dog_name, owner_name, breed, phone, email, service,
               TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
               TO_CHAR(appointment_time, 'HH24:MI') AS appointment_time,
               status, created_at
        FROM appointments
        ORDER BY appointment_date ASC, appointment_time ASC, created_at ASC
      `;
      return res.status(200).json(rows.map(mapAppointment));
    }

    if (req.method === 'POST') {
      const { dogName, ownerName, breed, phone, email, service, date, time } = req.body || {};

      if (!dogName || !ownerName || !breed || !service || !date || !time) {
        return res.status(400).json({ error: 'dogName, ownerName, breed, service, date and time are required.' });
      }

      const rows = await sql`
        INSERT INTO appointments
          (dog_name, owner_name, breed, phone, email, service, appointment_date, appointment_time, status)
        VALUES
          (${dogName}, ${ownerName}, ${breed}, ${phone || null}, ${email || null}, ${service}, ${date}, ${time}, 'scheduled')
        RETURNING id, dog_name, owner_name, breed, phone, email, service,
                  TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
                  TO_CHAR(appointment_time, 'HH24:MI') AS appointment_time,
                  status, created_at
      `;

      return res.status(201).json(mapAppointment(rows[0]));
    }

    if (req.method === 'PATCH') {
      const { id, status } = req.body || {};
      const allowedStatuses = ['scheduled', 'completed', 'cancelled'];

      if (!id || !allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'A valid id and status are required.' });
      }

      const rows = await sql`
        UPDATE appointments
        SET status = ${status}
        WHERE id = ${id}
        RETURNING id, dog_name, owner_name, breed, phone, email, service,
                  TO_CHAR(appointment_date, 'YYYY-MM-DD') AS appointment_date,
                  TO_CHAR(appointment_time, 'HH24:MI') AS appointment_time,
                  status, created_at
      `;

      if (!rows.length) return res.status(404).json({ error: 'Appointment not found.' });
      return res.status(200).json(mapAppointment(rows[0]));
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id;
      if (!id) return res.status(400).json({ error: 'Appointment id is required.' });

      const rows = await sql`
        DELETE FROM appointments
        WHERE id = ${id}
        RETURNING id
      `;

      if (!rows.length) return res.status(404).json({ error: 'Appointment not found.' });
      return res.status(200).json({ success: true, id });
    }

    res.setHeader('Allow', 'GET, POST, PATCH, DELETE');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Database request failed.' });
  }
};
