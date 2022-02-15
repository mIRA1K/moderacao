const { vUnmuteTarget } = require("@utils/modUtils");

module.exports = async ({ member }, target, reason) => {
  const response = await vUnmuteTarget(member, target, reason);
  if (typeof response === "boolean") {
    return `${target.user.tag}'s voice is unmuted in this server`;
  }
  if (response === "MEMBER_PERM") {
    return `Você não tem permissão para voice unmute ${target.user.tag}`;
  }
  if (response === "BOT_PERM") {
    return `Eu não tenho permissão para voice unmute ${target.user.tag}`;
  }
  if (response === "NO_VOICE") {
    return `${target.user.tag} não está em nenhum canal de voz`;
  }
  if (response === "NOT_MUTED") {
    return `${target.user.tag} is not voice muted`;
  }
  return `Failed to voice unmute ${target.user.tag}`;
};
