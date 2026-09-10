const c = require("ansi-colors");

const requiredEnvs = [
  {
    key: "NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY",
    // TODO: we need a good doc to point this to
    description:
      "Learn how to create a publishable key: https://docs.medusajs.com/v2/resources/storefront-development/publishable-api-keys",
  },
];

function isMissingPublishableKey() {
  const keys = [
    process.env.MEDUSA_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
    process.env.RUNTIME_NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  ]

  return !keys.some(function (value) {
    if (!value) {
      return false
    }

    if (value.includes("${")) {
      return false
    }

    return value.trim().startsWith("pk_")
  })
}

function checkEnvVariables() {
  if (!isMissingPublishableKey()) {
    return
  }

  if (process.env.ZEROPS_ProjectId) {
    console.warn(
      "Build: publishable key not resolved yet; runtime will respawn until medusa CHANNEL_PUBLISHABLE_KEY is a pk_ key."
    )
    return
  }

  const missingEnvs = requiredEnvs;

  if (missingEnvs.length > 0) {
    console.error(
      c.red.bold("\n🚫 Error: Missing required environment variables\n")
    );

    missingEnvs.forEach(function (env) {
      console.error(c.yellow(`  ${c.bold(env.key)}`));
      if (env.description) {
        console.error(c.dim(`    ${env.description}\n`));
      }
    });

    console.error(
      c.yellow(
        "\nPlease set these variables in your .env file or environment before starting the application.\n"
      )
    );

    process.exit(1);
  }
}

module.exports = checkEnvVariables;
