// utils/check-env.ts
require('dotenv').config({ path: '.env' });
const chalk = require('chalk');

// Validation rules
const ENV_SCHEMA = {
  MASTER_KEY: {
    required: true,
    validate: (val?: string) => val?.length === 64,
    error: 'Must be 64-character hex'
  },
  DATABASE_URL: {
    required: true,
    validate: (val?: string) => !!val,
    error: 'Must be a valid connection string'
  },
  NODE_ENV: {
    required: true,
    validate: (val?: string) => ['development', 'production'].includes(val || ''),
    error: 'Must be "development" or "production"'
  }
} as const;

// Format values for display
const formatValue = (value: string) => {
  if (value.length > 24) {
    return `${value.substring(0, 12)}...${value.slice(-4)}`;
  }
  return value;
};

// Run validation
const results = Object.entries(ENV_SCHEMA).map(([key, rule]) => {
  const value = process.env[key] || '';
  const isValid = rule.validate(value);
  return {
    key,
    value: formatValue(value),
    status: isValid ? chalk.green('✅') : chalk.red('❌'),
    isValid
  };
});

// Display results
console.log(chalk.bold('\nEnvironment Variables:'));
results.forEach(({ key, value, status }) => {
  console.log(`  ${chalk.bold(key.padEnd(12))}: ${value.padEnd(24)} ${status}`);
});

// Handle errors
const hasErrors = results.some(({ isValid }) => !isValid);
if (hasErrors) {
  console.error(chalk.red.bold('\n⛔ Environment Validation Failed:'));
  results.forEach(({ key, status, isValid }) => {
    if (!isValid) {
      const rule = ENV_SCHEMA[key as keyof typeof ENV_SCHEMA];
      console.log(chalk.yellow(`- ${key}: ${rule.error}`));
    }
  });
  process.exit(1);
}

console.log(chalk.green.bold('\n✅ Environment is valid\n'));