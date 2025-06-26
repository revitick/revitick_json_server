const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.post('/api/upload-json', async (req, res) => {
    try {
        const jsonData = req.body;

        if (!jsonData || typeof jsonData !== 'object') {
            return res.status(400).json({ error: 'Invalid JSON' });
        }

        console.log("🔵 Received JSON:", JSON.stringify(jsonData, null, 2));

        // 👉 Flatten JSON
        const flatData = [];

        for (const group of jsonData.results || []) {
            const meta = {
                project_name: group.project_name || jsonData.project || '',
                username: group.username || 'unknown',
                revit_file: group.revit_file || 'unknown.rvt',
                timestamp: group.timestamp || jsonData.timestamp || new Date().toISOString(),
                type: group.type || 'unknown'
            };

            for (const item of group.results || []) {
                flatData.push({
                    ...meta,
                    stair_id: item.StairId,
                    run_name: item.RunName,
                    width_mm: item.WidthMm,
                    compliant: item.Compliant
                });
            }
        }

        // 👉 Send to Supabase if available
        if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
            const response = await axios.post(`${process.env.SUPABASE_URL}/rest/v1/bim_json`,
                flatData,
                {
                    headers: {
                        apikey: process.env.SUPABASE_KEY,
                        Authorization: `Bearer ${process.env.SUPABASE_KEY}`,
                        'Content-Type': 'application/json',
                        Prefer: 'return=minimal'
                    }
                });

            console.log("✅ Sent to Supabase.");
        }

        res.status(200).json({ success: true });
    } catch (err) {
        if (err.response) {
            console.error("❌ Supabase error:", err.response.status, err.response.data);
        } else {
            console.error("❌ Server error:", err.message);
        }
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
