const { deafenTarget } = require("@utils/modUtils");

module.exports = async ({ member }, target, reason) => {
  const response = await deafenTarget(member, target, reason);
  if (typeof response === "boolean") {
    return `${target.user.tag} está ensurdecido neste servidor`;
  }
  if (response === "MEMBER_PERM") {
    return `Você não tem permissão para ensurdecer ${target.user.tag}`;
  }
  if (response === "BOT_PERM") {
    return `Eu não tenho permissão para ensurdecer ${target.user.tag}`;
  }
  if (response === "NO_VOICE") {
    return `${target.user.tag} não está em nenhum canal de voz`;
  }
  if (response === "ALREADY_DEAFENED") {
    return `${target.user.tag} ja esta ensurdecido`;
  }
  return `Falha ao ensurdecer ${target.user.tag}`;
};
