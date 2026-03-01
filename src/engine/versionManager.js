/**
 * Utilidades de versionado de reglas clínicas.
 * Diseñado para ser reutilizable y migrable a una capa de persistencia futura.
 */

const nowIso = () => new Date().toISOString();

/**
 * Normaliza metadatos de versionado al crear/actualizar reglas.
 *
 * @param {object} rule
 * @param {object} options
 * @param {string} options.defaultVersion
 * @param {boolean} options.preserveCreatedAt
 * @returns {object}
 */
export const ensureRuleVersionMetadata = (
  rule,
  { defaultVersion = 'NTS-2024', preserveCreatedAt = true } = {},
) => {
  const createdAt = preserveCreatedAt && rule.createdAt ? rule.createdAt : nowIso();

  return {
    ...rule,
    ntsVersion: rule.ntsVersion || defaultVersion,
    active: rule.active !== undefined ? Boolean(rule.active) : true,
    createdAt,
    updatedAt: nowIso(),
  };
};

/**
 * Obtiene versiones presentes y su estado resumido.
 *
 * @param {object[]} rules
 * @returns {Array<{version:string,total:number,activeCount:number,inactiveCount:number}>}
 */
export const getVersionSummary = (rules = []) => {
  const summaryMap = new Map();

  rules.forEach((rule) => {
    const version = rule.ntsVersion || 'SIN_VERSION';
    if (!summaryMap.has(version)) {
      summaryMap.set(version, { version, total: 0, activeCount: 0, inactiveCount: 0 });
    }

    const stats = summaryMap.get(version);
    stats.total += 1;
    if (rule.active) {
      stats.activeCount += 1;
    } else {
      stats.inactiveCount += 1;
    }
  });

  return Array.from(summaryMap.values()).sort((a, b) => a.version.localeCompare(b.version));
};

/**
 * Filtra reglas por versión y estado.
 *
 * @param {object[]} rules
 * @param {string} version
 * @returns {object[]}
 */
export const getRulesByVersion = (rules = [], version = '') =>
  rules.filter((rule) => (version ? rule.ntsVersion === version : true));

/**
 * Selecciona reglas evaluables por motor (solo activas y de la versión global activa).
 *
 * @param {object[]} rules
 * @param {string} activeVersion
 * @returns {object[]}
 */
export const getEvaluableRules = (rules = [], activeVersion = '') =>
  rules.filter((rule) => rule.active && (!activeVersion || rule.ntsVersion === activeVersion));

/**
 * Activa o desactiva todas las reglas de una versión.
 *
 * @param {object[]} rules
 * @param {string} version
 * @param {boolean} nextActive
 * @returns {object[]}
 */
export const setVersionActiveState = (rules = [], version, nextActive) =>
  rules.map((rule) =>
    rule.ntsVersion === version
      ? {
          ...rule,
          active: nextActive,
          updatedAt: nowIso(),
        }
      : rule,
  );

/**
 * Clona todas las reglas de una versión origen a una nueva versión destino.
 *
 * @param {object[]} rules
 * @param {string} sourceVersion
 * @param {string} targetVersion
 * @returns {object[]}
 */
export const cloneRulesToVersion = (rules = [], sourceVersion, targetVersion) => {
  const sourceRules = rules.filter((rule) => rule.ntsVersion === sourceVersion);
  const cloned = sourceRules.map((rule) => ({
    ...rule,
    id: `${rule.id}_${targetVersion}`,
    ntsVersion: targetVersion,
    active: true,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }));

  return [...rules, ...cloned];
};
