const { moveTarget } = require("@utils/modUtils");

module.exports = async ({ member }, target, reason, channel) => {
  const response = await moveTarget(member, target, reason, channel);
  if (typeof response === "boolean") {
    return `${target.user.tag} está ensurdecido neste servidor`;
  }
  if (response === "MEMBER_PERM") {
    return `Você não tem permissão para disconnect ${target.user.tag}`;
  }
  if (response === "BOT_PERM") {
    return `Eu não tenho permissão para disconnect ${target.user.tag}`;
  }
  if (response === "NO_VOICE") {
    return `${target.user.tag} não está em nenhum canal de voz`;
  }
  if (response === "TARGET_PERM") {
    return `${target.user.tag} não tem permissão para entrar ${channel}`;
  }
  if (response === "ALREADY_IN_CHANNEL") {
    return `${target.user.tag} já está conectado a ${channel}`;
  }
  return `Falha ao mover ${target.user.tag} to ${channel}`;
};
