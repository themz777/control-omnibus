module.exports = {
  adminUser: process.env.ADMIN_USER || 'admin',
  adminPassword: process.env.ADMIN_PASSWORD || '123456',
  sessionToken: process.env.SESSION_TOKEN || 'tesis_terminal_cde_2026',
  reminderMinutesBefore: Number(process.env.REMINDER_MINUTES_BEFORE || 30),
  delayThresholdMinutes: Number(process.env.DELAY_THRESHOLD_MINUTES || 10),
  autoHideSalioMin: Number(process.env.AUTO_HIDE_SALIO_MIN || 10),
  autoHideCanceladoMin: Number(process.env.AUTO_HIDE_CANCELADO_MIN || 60),
  schedulerIntervalSeconds: Number(process.env.SCHEDULER_INTERVAL_SECONDS || 30),
  whatsappEnabled: String(process.env.WHATSAPP_ENABLED || 'false') === 'true',
  whatsappToken: process.env.WHATSAPP_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || ''
};
