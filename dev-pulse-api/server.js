import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import si from 'systeminformation';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());


app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});


app.get('/', (req, res) => {
    res.send(`
        <h1>🚀 DevPulse API — System Monitor</h1>
        <p>Доступные эндпоинты:</p>
        <ul>
            <li><a href="/api/health">/api/health</a> — Статус сервера</li>
            <li><a href="/api/v1/system">/api/v1/system</a> — Полная информация о системе</li>
            <li><a href="/api/v1/cpu">/api/v1/cpu</a> — Загрузка CPU</li>
            <li><a href="/api/v1/ram">/api/v1/ram</a> — Использование RAM</li>
            <li><a href="/api/v1/disks">/api/v1/disks</a> — Метрики дисков</li>
        </ul>
    `);
});


app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});


app.get('/api/v1/system', async (req, res) => {
    try {
        const [cpu, mem, osInfo, currentLoad] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.osInfo(),
            si.currentLoad()
        ]);

        res.json({
            os: {
                platform: osInfo.platform,
                distro: osInfo.distro,
                release: osInfo.release,
                arch: osInfo.arch,
                hostname: osInfo.hostname
            },
            cpu: {
                manufacturer: cpu.manufacturer,
                brand: cpu.brand,
                cores: cpu.cores,
                physicalCores: cpu.physicalCores,
                loadPercentage: Number(currentLoad.currentLoad.toFixed(2))
            },
            ram: {
                totalGB: (mem.total / (1024 ** 3)).toFixed(2),
                usedGB: (mem.used / (1024 ** 3)).toFixed(2),
                freeGB: (mem.free / (1024 ** 3)).toFixed(2),
                usedPercentage: Number(((mem.used / mem.total) * 100).toFixed(2))
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch system metrics' });
    }
});


app.get('/api/v1/cpu', async (req, res) => {
    try {
        const load = await si.currentLoad();
        const cpu = await si.cpu();
        res.json({
            brand: `${cpu.manufacturer} ${cpu.brand}`,
            overallLoad: Number(load.currentLoad.toFixed(2)),
            coresLoad: load.cpus.map((c, idx) => ({
                core: idx + 1,
                load: Number(c.load.toFixed(2))
            }))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch CPU stats' });
    }
});


app.get('/api/v1/ram', async (req, res) => {
    try {
        const mem = await si.mem();
        res.json({
            totalMB: Math.round(mem.total / (1024 ** 2)),
            usedMB: Math.round(mem.used / (1024 ** 2)),
            freeMB: Math.round(mem.free / (1024 ** 2)),
            usedPercent: Number(((mem.used / mem.total) * 100).toFixed(2))
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch RAM stats' });
    }
});


app.get('/api/v1/disks', async (req, res) => {
    try {
        const fsSize = await si.fsSize();
        const disks = fsSize.map(disk => ({
            drive: disk.fs,
            type: disk.type,
            mount: disk.mount,
            totalGB: (disk.size / (1024 ** 3)).toFixed(2),
            usedGB: (disk.used / (1024 ** 3)).toFixed(2),
            usePercentage: Number(disk.use.toFixed(2))
        }));
        res.json({ count: disks.length, disks });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch disk stats' });
    }
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 System Monitor API running on http://localhost:${PORT}`);
});