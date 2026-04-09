// utils/chalkLogger.js
import chalk from 'chalk';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Enhanced Chalk Logger Utility
 * Provides colorized console logging with various formatting options
 */
class ChalkLogger {
    constructor() {
        this.isDev = isDev;
        this.colors = {
            string: chalk.green,
            number: chalk.blue,
            boolean: chalk.red,
            function: chalk.yellow,
            null: chalk.gray,
            undefined: chalk.gray,
            object: chalk.white
        };

        this.methodColors = {
            GET: chalk.blue,
            POST: chalk.green,
            PUT: chalk.yellow,
            DELETE: chalk.red,
            PATCH: chalk.magenta,
            OPTIONS: chalk.cyan,
            HEAD: chalk.white
        };
    }

    /**
     * Get appropriate color for value type
     */
    getTypeColor(value) {
        if (value === null) return this.colors.null;
        if (value === undefined) return this.colors.undefined;
        return this.colors[typeof value] || this.colors.object;
    }

    /**
     * Format value with appropriate color and representation
     */
    formatValue(value) {
        if (value === null) return this.colors.null('null');
        if (value === undefined) return this.colors.undefined('undefined');
        if (typeof value === 'string') return this.colors.string(`"${value}"`);
        if (typeof value === 'number') return this.colors.number(value);
        if (typeof value === 'boolean') return this.colors.boolean(value);
        if (typeof value === 'function') return this.colors.function('[Function]');
        if (value instanceof Date) return this.colors.object(value.toISOString());
        if (value instanceof Error) return chalk.red(`Error: ${value.message}`);
        return this.colors.object(String(value));
    }

    /**
     * Display nested objects and arrays with proper indentation
     */
    displayNested(data, indent = 0) {
        const spaces = '  '.repeat(indent);

        if (Array.isArray(data)) {
            data.forEach((item, index) => {
                if (this.isComplexType(item)) {
                    console.log(`${spaces}${chalk.red(`[${index}]:`)} ${this.getTypeIndicator(item)}`);
                    this.displayNested(item, indent + 1);
                } else {
                    console.log(`${spaces}${chalk.red(`[${index}]:`)} ${this.formatValue(item)}`);
                }
            });
        } else if (data && typeof data === 'object') {
            Object.entries(data).forEach(([key, value]) => {
                if (this.isComplexType(value)) {
                    console.log(`${spaces}${chalk.yellow(key)}: ${this.getTypeIndicator(value)}`);
                    this.displayNested(value, indent + 1);
                } else {
                    console.log(`${spaces}${chalk.yellow(key)}: ${this.formatValue(value)}`);
                }
            });
        }
    }

    /**
     * Check if value is a complex type (object or array)
     */
    isComplexType(value) {
        return Array.isArray(value) || (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof Error));
    }

    /**
     * Get type indicator for complex types
     */
    getTypeIndicator(value) {
        if (Array.isArray(value)) {
            return chalk.cyan(`[Array(${value.length})]`);
        }
        if (value && typeof value === 'object') {
            const keys = Object.keys(value);
            return chalk.gray(`{Object(${keys.length} keys)}`);
        }
        return '';
    }

    /**
     * Create separator line
     */
    separator(char = '─', length = 50) {
        return chalk.gray(char.repeat(length));
    }

    /**
     * Get timestamp for debug logging
     */
    getTimestamp() {
        return new Date().toISOString();
    }

    /**
     * Basic object logging with JSON formatting
     */
    object(obj, label = 'Object') {
        if (!this.isDev) return;

        console.log(`\n${chalk.cyan.bold(`🔍 ${label}`)}`);
        console.log(this.separator());

        try {
            console.log(JSON.stringify(obj, null, 2));
        } catch (error) {
            console.log(chalk.red('Error serializing object:'), error.message);
            console.log(obj);
        }

        console.log(this.separator());
    }

    /**
     * Structured logging with colors and proper formatting
     */
    structured(obj, label = 'Data') {
        if (!this.isDev) return;

        console.log(`\n${chalk.magenta.bold(`📊 ${label}`)}`);
        console.log(this.separator('═'));

        if (Array.isArray(obj)) {
            console.log(chalk.cyan(`[Array(${obj.length})]`));
            this.displayNested(obj, 0);
        } else if (this.isComplexType(obj)) {
            console.log(chalk.yellow('{'));
            this.displayNested(obj, 0);
            console.log(chalk.yellow('}'));
        } else {
            console.log(this.formatValue(obj));
        }

        console.log(this.separator('═'));
    }

    /**
     * API request/response logging
     */
    api(method, url, data = null, response = null) {
        if (!this.isDev) return;

        const methodColor = this.methodColors[method.toUpperCase()] || chalk.white;

        console.log(`\n${chalk.bgBlack.white.bold(` 🌐 API ${method.toUpperCase()} `)}`);
        console.log(methodColor.bold(`URL: ${url}`));

        if (data) {
            console.log(chalk.cyan.bold('\n📤 Request:'));
            try {
                console.log(JSON.stringify(data, null, 2));
            } catch (error) {
                console.log('Request data (non-serializable):', data);
            }
        }

        if (response) {
            console.log(chalk.green.bold('\n📥 Response:'));
            try {
                console.log(JSON.stringify(response, null, 2));
            } catch (error) {
                console.log('Response data (non-serializable):', response);
            }
        }

        console.log(this.separator('─', 60));
    }

    /**
     * JSON with syntax highlighting
     */
    json(obj, label = 'JSON') {
        if (!this.isDev) return;

        console.log(`\n${chalk.yellow.bold(`📄 ${label}`)}`);
        console.log(this.separator('─', 30));

        try {
            const jsonString = JSON.stringify(obj, null, 2)
                .replace(/"([^"]+)":/g, chalk.cyan('"$1"') + ':')
                .replace(/: "([^"]*)"/g, ': ' + chalk.green('"$1"'))
                .replace(/: (\d+(?:\.\d+)?)/g, ': ' + chalk.blue('$1'))
                .replace(/: (true|false)/g, ': ' + chalk.red('$1'))
                .replace(/: null/g, ': ' + chalk.gray('null'));

            console.log(jsonString);
        } catch (error) {
            console.log(chalk.red('Error formatting JSON:'), error.message);
            console.log(obj);
        }

        console.log(this.separator('─', 30));
    }

    /**
     * Table logging
     */
    table(data, label = 'Table') {
        if (!this.isDev) return;

        console.log(`\n${chalk.blue.bold(`📋 ${label}`)}`);
        console.log(this.separator('─', 40));

        if (Array.isArray(data)) {
            console.table(data);
        } else if (data && typeof data === 'object') {
            const tableData = Object.entries(data).map(([key, value]) => ({
                Property: key,
                Value: this.isComplexType(value) ? JSON.stringify(value) : String(value),
                Type: Array.isArray(value) ? 'array' : typeof value
            }));
            console.table(tableData);
        } else {
            console.log(chalk.yellow('Data is not an object or array'));
            this.object(data, label);
        }

        console.log(this.separator('─', 40));
    }

    /**
     * Error logging with stack trace
     */
    error(error, context = {}) {
        console.log(`\n${chalk.bgRed.white.bold(' ❌ ERROR ')}`);

        if (error instanceof Error) {
            console.log(chalk.red.bold(`Message: ${error.message}`));
            if (error.stack) {
                console.log(chalk.red('\nStack Trace:'));
                console.log(chalk.dim(error.stack));
            }
        } else {
            console.log(chalk.red.bold('Error Data:'));
            try {
                console.log(JSON.stringify(error, null, 2));
            } catch (e) {
                console.log(error);
            }
        }

        if (Object.keys(context).length > 0) {
            console.log(chalk.yellow.bold('\nContext:'));
            try {
                console.log(JSON.stringify(context, null, 2));
            } catch (e) {
                console.log(context);
            }
        }

        console.log(this.separator('─', 60));
    }

    /**
     * Success logging
     */
    success(message, data = null) {
        if (!this.isDev && !process.env.FORCE_LOG) return;

        console.log(`\n${chalk.bgGreen.black.bold(' ✅ SUCCESS ')}`);
        console.log(chalk.green.bold(message));

        if (data) {
            try {
                console.log(JSON.stringify(data, null, 2));
            } catch (error) {
                console.log(data);
            }
        }

        console.log('');
    }

    /**
     * Debug logging with timestamp
     */
    debug(data, label = 'Debug') {
        if (!this.isDev) return;

        const timestamp = this.getTimestamp();
        console.log(`\n${chalk.gray(`[${timestamp}]`)} ${chalk.magenta.bold(`🐛 ${label}`)}`);

        try {
            console.log(JSON.stringify(data, null, 2));
        } catch (error) {
            console.log(data);
        }

        console.log('');
    }

    /**
     * Warning logging
     */
    warn(message, data = null) {
        if (!this.isDev) return;

        console.log(`\n${chalk.bgYellow.black.bold(' ⚠️ WARNING ')}`);
        console.log(chalk.yellow.bold(message));

        if (data) {
            try {
                console.log(JSON.stringify(data, null, 2));
            } catch (error) {
                console.log(data);
            }
        }

        console.log('');
    }

    /**
     * Info logging
     */
    info(message, data = null) {
        if (!this.isDev) return;

        console.log(`\n${chalk.bgBlue.white.bold(' ℹ️ INFO ')}`);
        console.log(chalk.blue.bold(message));

        if (data) {
            try {
                console.log(JSON.stringify(data, null, 2));
            } catch (error) {
                console.log(data);
            }
        }

        console.log('');
    }

    /**
     * Universal logger - auto-detects type and uses appropriate method
     */
    log(label, data) {
        if (!this.isDev) return;

        // Handle error objects
        if (data instanceof Error) {
            this.error(data, { context: label });
            return;
        }

        // Handle success messages
        if (typeof label === 'string' && label.toLowerCase().includes('success')) {
            this.success(typeof data === 'string' ? data : label, typeof data === 'string' ? null : data);
            return;
        }

        // Handle warning messages
        if (typeof label === 'string' && label.toLowerCase().includes('warn')) {
            this.warn(typeof data === 'string' ? data : label, typeof data === 'string' ? null : data);
            return;
        }

        // Handle complex data structures
        if (this.isComplexType(data)) {
            this.structured(data, label);
            return;
        }

        // Handle primitives
        this.object(data, label);
    }

    /**
     * Performance timing logger
     */
    time(label) {
        if (!this.isDev) return;
        console.time(chalk.blue.bold(`⏱️ ${label}`));
    }

    /**
     * End performance timing
     */
    timeEnd(label) {
        if (!this.isDev) return;
        console.timeEnd(chalk.blue.bold(`⏱️ ${label}`));
    }

    /**
     * Group logging
     */
    group(label) {
        if (!this.isDev) return;
        console.group(chalk.cyan.bold(`📁 ${label}`));
    }

    /**
     * End group logging
     */
    groupEnd() {
        if (!this.isDev) return;
        console.groupEnd();
    }
}

// Create singleton instance
const chalkLog = new ChalkLogger();

// Export the instance
export { chalkLog };

// Usage Examples:
/*
// Basic logging
chalkLog.object({ name: 'John', age: 30 }, 'User Data');

// Structured logging
chalkLog.structured({
  user: 'john.doe',
  active: true,
  profile: {
    name: 'John Doe',
    roles: ['user', 'admin'],
    settings: {
      theme: 'dark',
      notifications: true
    }
  }
}, 'User Profile');

// API logging
chalkLog.api('POST', '/api/users', { name: 'John' }, { id: 1, name: 'John' });

// Error logging
chalkLog.error(new Error('Something went wrong'), { userId: 123 });

// Success logging
chalkLog.success('User created successfully', { id: 1, name: 'John' });

// Debug logging
chalkLog.debug({ queryParams: req.query }, 'Request Debug');

// Warning logging
chalkLog.warn('Deprecated API endpoint used', { endpoint: '/old-api' });

// Info logging
chalkLog.info('Server started', { port: 3000 });

// Performance timing
chalkLog.time('Database Query');
// ... some operation
chalkLog.timeEnd('Database Query');

// Grouped logging
chalkLog.group('User Registration Process');
chalkLog.info('Validating user data');
chalkLog.info('Creating user record');
chalkLog.success('User registered successfully');
chalkLog.groupEnd();

// Auto-detection
chalkLog.log('Homepage Data', courses); // Will use structured logging
chalkLog.log('Simple Message', 'Hello World'); // Will use object logging
*/