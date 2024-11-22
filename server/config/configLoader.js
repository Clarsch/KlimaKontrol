const fs = require('fs').promises;
const path = require('path');

class ConfigLoader {
    constructor() {
        this.externalConfigPath = path.resolve(__dirname, '../../../klima_kontrol_config/server/data');
        this.cache = new Map();
    }

    async loadConfig(configName, forceReload = false) {
        try {
            if (!forceReload && this.cache.has(configName)) {
                return this.cache.get(configName);
            }

            const filePath = path.join(this.externalConfigPath, `${configName}.js`);
            await fs.access(filePath);
            
            if (forceReload) {
                delete require.cache[require.resolve(filePath)];
            }
            
            const config = require(filePath);
            this.cache.set(configName, config);
            
            if (forceReload) {
                console.log(`Reloaded config: ${configName}`);
            }
            
            return config;
        } catch (error) {
            console.error(`\nError: Could not load external config for ${configName}`);
            console.error(`Expected config file at: ${path.join(this.externalConfigPath, `${configName}.js`)}`);
            throw new Error(`Missing required external configuration: ${configName}`);
        }
    }

    async getAreasWithLocations(forceReload = false) {
        const areas = await this.loadConfig('areas', forceReload);
        
        return areas.map(area => ({
            name: area.name,
            locations: area.locations.map(location => ({
                id: location
            }))
        }));
    }

    async reloadAllConfigs() {
        console.log('Reloading all configurations...');
        this.cache.clear();
        await this.initialize(true);
        console.log('All configurations reloaded successfully');
    }

    async initialize(forceReload = false) {
        try {
            await fs.access(this.externalConfigPath);
            const requiredConfigs = ['users', 'locations', 'areas'];
            
            for (const config of requiredConfigs) {
                const configPath = path.join(this.externalConfigPath, `${config}.js`);
                await fs.access(configPath);
                await this.loadConfig(config, forceReload);
                console.log(`Found config file: ${config}.js`);
            }
        } catch (error) {
            console.error('\nFatal Error: External configuration setup is invalid');
            throw error;
        }
    }

    async saveConfig(configName, data) {
        try {
            const filePath = path.join(this.externalConfigPath, `${configName}.js`);
            const configContent = `module.exports = ${JSON.stringify(data, null, 2)};`;
            
            await fs.writeFile(filePath, configContent);
            this.cache.set(configName, data);
            
            console.log(`Saved config: ${configName}`);
        } catch (error) {
            console.error(`Error saving config ${configName}:`, error);
            throw new Error(`Failed to save configuration: ${configName}`);
        }
    }
}

module.exports = new ConfigLoader(); 