#!/usr/bin/env bun
/**
 * Anthropic-Compatible Proxy CLI
 *
 * Start a local proxy server that accepts Anthropic API requests
 * and routes them to OCI GenAI.
 */

import { parseArgs } from 'util';
import type { ProxyConfig } from './types.js';
import { startServer } from './server.js';

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    port: {
      type: 'string',
      short: 'p',
      default: '8080',
    },
    host: {
      type: 'string',
      short: 'h',
      default: 'localhost',
    },
    region: {
      type: 'string',
      short: 'r',
      default: process.env.OCI_REGION || 'eu-frankfurt-1',
    },
    compartment: {
      type: 'string',
      short: 'c',
      default: process.env.OCI_COMPARTMENT_ID || '',
    },
    profile: {
      type: 'string',
      default: process.env.OCI_CONFIG_PROFILE || 'DEFAULT',
    },
    verbose: {
      type: 'boolean',
      short: 'v',
      default: false,
    },
    help: {
      type: 'boolean',
      default: false,
    },
  },
});

if (values.help) {
  console.warn(`
OCI Anthropic-Compatible Proxy

Starts a local proxy server that accepts Anthropic Messages API requests
and routes them to OCI GenAI Service.

Usage:
  oci-anthropic-proxy [options]

Options:
  -p, --port <port>        Port to listen on (default: 8080)
  -h, --host <host>        Host to bind to (default: localhost)
  -r, --region <region>    OCI region (default: eu-frankfurt-1)
  -c, --compartment <id>   OCI compartment OCID (required)
      --profile <name>     OCI config profile (default: DEFAULT)
  -v, --verbose            Enable verbose logging
      --help               Show this help message

Environment Variables:
  OCI_REGION           Default region
  OCI_COMPARTMENT_ID   Default compartment OCID
  OCI_CONFIG_PROFILE   Default config profile

Example:
  # Start proxy with environment variables
  export OCI_COMPARTMENT_ID="ocid1.compartment.oc1..."
  oci-anthropic-proxy -p 8080

  # Configure Claude Code to use the proxy
  export ANTHROPIC_API_URL="http://localhost:8080"
  claude
`);
  process.exit(0);
}

if (!values.compartment) {
  console.error('Error: Compartment OCID is required.');
  console.error('Set OCI_COMPARTMENT_ID environment variable or use --compartment flag.');
  process.exit(1);
}

const config: ProxyConfig = {
  port: parseInt(values.port, 10),
  host: values.host,
  region: values.region,
  compartmentId: values.compartment,
  profile: values.profile,
  verbose: values.verbose,
};

// Start server
const { stop } = startServer(config);

// Graceful shutdown
process.on('SIGINT', () => {
  console.warn('\nShutting down...');
  stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  stop();
  process.exit(0);
});
