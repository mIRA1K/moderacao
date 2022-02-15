const { vMuteTarget } = require("@utils/modUtils");

module.exports = async ({ member }, target, reason) => {
  const response = await vMuteTarget(member, target, reason);
  if (typeof response === "boolean") {
    return `${target.user.tag}'s voice is muted in this server`;
  }
  if (response === "MEMBER_PERM") {
    return `Você não tem permissão para voice mute ${target.user.tag}`;
  }
  if (response === "BOT_PERM") {
    return `Eu não tenho permissão para voice mute ${target.user.tag}`;
  }
  if (response === "NO_VOICE") {
    return `${target.user.tag} não está em nenhum canal de voz`;
  }
  if (response === "ALREADY_MUTED") {
    return `${target.user.tag} is already muted`;
  }
  return `Failed to voice mute ${target.user.tag}`;
};
