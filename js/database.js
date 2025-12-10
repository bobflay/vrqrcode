// Database module using sql.js (SQLite compiled to WebAssembly)
let db = null;
let SQL = null;

const DB_NAME = 'qrscanner_db';

export async function initDatabase() {
    if (db) return db;

    try {
        // Load sql.js with WASM
        SQL = await initSqlJs({
            locateFile: file => `https://sql.js.org/dist/${file}`
        });

        // Try to load existing database from localStorage
        const savedDb = localStorage.getItem(DB_NAME);
        if (savedDb) {
            const uint8Array = new Uint8Array(JSON.parse(savedDb));
            db = new SQL.Database(uint8Array);
            console.log('Database loaded from localStorage');
        } else {
            db = new SQL.Database();
            console.log('New database created');
        }

        // Run migrations
        await runMigrations();

        return db;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        throw error;
    }
}

export function getDatabase() {
    return db;
}

export function saveDatabase() {
    if (!db) return;

    try {
        const data = db.export();
        const array = Array.from(data);
        localStorage.setItem(DB_NAME, JSON.stringify(array));
        console.log('Database saved to localStorage');
    } catch (error) {
        console.error('Failed to save database:', error);
    }
}

export function executeQuery(sql, params = []) {
    if (!db) {
        throw new Error('Database not initialized');
    }

    try {
        const result = db.exec(sql, params);
        saveDatabase();
        return result;
    } catch (error) {
        console.error('Query error:', error);
        throw error;
    }
}

export function runStatement(sql, params = []) {
    if (!db) {
        throw new Error('Database not initialized');
    }

    try {
        db.run(sql, params);
        saveDatabase();
    } catch (error) {
        console.error('Statement error:', error);
        throw error;
    }
}

export function prepareStatement(sql) {
    if (!db) {
        throw new Error('Database not initialized');
    }
    return db.prepare(sql);
}

// Migration system
const migrations = [
    {
        version: 1,
        name: 'create_migrations_table',
        sql: `
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version INTEGER NOT NULL UNIQUE,
                name TEXT NOT NULL,
                applied_at TEXT NOT NULL
            );
        `
    },
    {
        version: 2,
        name: 'create_farmers_table',
        sql: `
            CREATE TABLE IF NOT EXISTS farmers (
                id TEXT PRIMARY KEY,
                identifier TEXT,
                matricule_fixed TEXT,
                lastname TEXT,
                firstname TEXT,
                civility TEXT,
                phone TEXT,
                other_phone TEXT,
                older_phone TEXT,
                sub_prefecture TEXT,
                birthday TEXT,
                birth_place TEXT,
                residence TEXT,
                delegation TEXT,
                departement TEXT,
                picture TEXT,
                agribusiness_id TEXT,
                buyer_id TEXT,
                created_at TEXT,
                updated_at TEXT,
                kyc TEXT,
                numPieceIdentite TEXT,
                comment TEXT
            );
        `
    }
];

async function runMigrations() {
    console.log('Running migrations...');

    // Ensure migrations table exists
    db.run(migrations[0].sql);

    // Get applied migrations
    const appliedResult = db.exec('SELECT version FROM migrations ORDER BY version');
    const appliedVersions = new Set();

    if (appliedResult.length > 0) {
        appliedResult[0].values.forEach(row => {
            appliedVersions.add(row[0]);
        });
    }

    // Run pending migrations
    for (const migration of migrations) {
        if (!appliedVersions.has(migration.version)) {
            console.log(`Running migration ${migration.version}: ${migration.name}`);

            try {
                db.run(migration.sql);

                // Record migration
                db.run(
                    'INSERT INTO migrations (version, name, applied_at) VALUES (?, ?, ?)',
                    [migration.version, migration.name, new Date().toISOString()]
                );

                console.log(`Migration ${migration.version} completed`);
            } catch (error) {
                console.error(`Migration ${migration.version} failed:`, error);
                throw error;
            }
        }
    }

    saveDatabase();
    console.log('All migrations completed');
}

// Farmers CRUD operations
export function insertFarmer(farmer) {
    const sql = `
        INSERT OR REPLACE INTO farmers (
            id, identifier, matricule_fixed, lastname, firstname, civility,
            phone, other_phone, older_phone, sub_prefecture, birthday, birth_place,
            residence, delegation, departement, picture, agribusiness_id, buyer_id,
            created_at, updated_at, kyc, numPieceIdentite, comment
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    runStatement(sql, [
        farmer.id,
        farmer.identifier,
        farmer.matricule_fixed,
        farmer.lastname,
        farmer.firstname,
        farmer.civility,
        farmer.phone,
        farmer.other_phone,
        farmer.older_phone,
        farmer.sub_prefecture,
        farmer.birthday,
        farmer.birth_place,
        farmer.residence,
        farmer.delegation,
        farmer.departement,
        farmer.picture,
        farmer.agribusiness_id,
        farmer.buyer_id,
        farmer.created_at,
        farmer.updated_at,
        farmer.kyc,
        farmer.numPieceIdentite,
        farmer.comment
    ]);
}

export function insertFarmers(farmers) {
    farmers.forEach(farmer => insertFarmer(farmer));
}

export function getAllFarmers() {
    const result = executeQuery('SELECT * FROM farmers');
    if (result.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map(row => {
        const farmer = {};
        columns.forEach((col, index) => {
            farmer[col] = row[index];
        });
        return farmer;
    });
}

export function getFarmerById(id) {
    const stmt = prepareStatement('SELECT * FROM farmers WHERE id = ?');
    stmt.bind([id]);

    if (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        const farmer = {};
        columns.forEach((col, index) => {
            farmer[col] = values[index];
        });
        stmt.free();
        return farmer;
    }

    stmt.free();
    return null;
}

export function getFarmerByIdentifier(identifier) {
    const stmt = prepareStatement('SELECT * FROM farmers WHERE identifier = ?');
    stmt.bind([identifier]);

    if (stmt.step()) {
        const columns = stmt.getColumnNames();
        const values = stmt.get();
        const farmer = {};
        columns.forEach((col, index) => {
            farmer[col] = values[index];
        });
        stmt.free();
        return farmer;
    }

    stmt.free();
    return null;
}

export function searchFarmers(query) {
    const searchTerm = `%${query}%`;
    const result = executeQuery(
        `SELECT * FROM farmers
         WHERE lastname LIKE ? OR firstname LIKE ? OR identifier LIKE ? OR phone LIKE ?
         LIMIT 50`,
        [searchTerm, searchTerm, searchTerm, searchTerm]
    );

    if (result.length === 0) return [];

    const columns = result[0].columns;
    return result[0].values.map(row => {
        const farmer = {};
        columns.forEach((col, index) => {
            farmer[col] = row[index];
        });
        return farmer;
    });
}

export function getFarmersCount() {
    const result = executeQuery('SELECT COUNT(*) as count FROM farmers');
    return result.length > 0 ? result[0].values[0][0] : 0;
}

export function deleteFarmer(id) {
    runStatement('DELETE FROM farmers WHERE id = ?', [id]);
}

export function clearFarmers() {
    runStatement('DELETE FROM farmers');
}
