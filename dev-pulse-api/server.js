import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import si from 'systeminformation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use(express.static('public'));



app.get('/api/v1/stream', (req, res) => {
    console.log(`[${new Date().toISOString()}] SSE client connected`);

    
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); 

    
    const sendStats = async () => {
        try {
            
            const [mem, currentLoad, disks] = await Promise.all([
                si.mem(),
                si.currentLoad(),
                si.fsSize()
            ]);

            
            const statsEvent = {
                type: 'system_stats',
                uptime: process.uptime(),
                ram: {
                    usedGB: (mem.used / (1024 ** 3)).toFixed(2),
                    totalGB: (mem.total / (1024 ** 3)).toFixed(2),
                    percent: Number(((mem.used / mem.total) * 100).toFixed(2))
                },
                cpu: {
                    load: Number(currentLoad.currentLoad.toFixed(2)),
                    cpus: currentLoad.cpus.map(core => core.load.toFixed(1))
                },
                disks: disks.map(disk => ({
                    drive: disk.fs,
                    mount: disk.mount,
                    totalGB: (disk.size / (1024 ** 3)).toFixed(2),
                    usedGB: (disk.used / (1024 ** 3)).toFixed(2),
                    percent: Number(disk.use.toFixed(1))
                }))
            };

            
            res.write(`data: ${JSON.stringify(statsEvent)}\n\n`);

        } catch (error) {
            console.error('Error fetching stats:', error);
            res.write('event: error\ndata: Failed to fetch data\n\n');
        }
    };

    
    sendStats();

   
    const intervalId = setInterval(sendStats, 1000);

    
    req.on('close', () => {
        console.log(`[${new Date().toISOString()}] SSE client disconnected`);
        clearInterval(intervalId);
        res.end();
    });
});



app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.get('/api/v1/static-system', async (req, res) => {
    try {
        const osInfo = await si.osInfo();
        const cpu = await si.cpu();
        res.json({
            os: {
                platform: osInfo.platform,
                distro: osInfo.distro,
                arch: osInfo.arch,
                hostname: osInfo.hostname
            },
            cpu: {
                brand: cpu.brand,
                cores: cpu.cores,
                physicalCores: cpu.physicalCores
            }
        });
    } catch (e) { res.status(500).json({ error: 'Server error' }); }
});


app.listen(PORT, () => {
    console.log(`🚀 Real-time Monitor API running on http://localhost:${PORT}`);
    console.log(`📡 SSE Stream: http://localhost:${PORT}/api/v1/stream`);
});