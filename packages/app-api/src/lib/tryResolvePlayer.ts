import { ctx, errors, logger } from '@takaro/util';
import {
  PlayerOnGameServerService,
  PlayerOnGameserverOutputWithRolesDTO,
} from '../service/PlayerOnGameserverService.js';
import { PlayerService } from '../service/Player/index.js';

const log = logger('lib:tryResolvePlayer');

/**
 * Try and resolve a player from the given input.
 * Supports (partial) names, IDs, ...
 * @param input Some user-provided input
 * @param gameServerId The game server to search within
 * @param onlineOnly If true, only match players who are currently online
 */
export async function tryResolvePlayer(
  input: string,
  gameServerId: string,
  onlineOnly: boolean = false,
): Promise<PlayerOnGameserverOutputWithRolesDTO> {
  const domainId = ctx.data.domain;

  if (!domainId) {
    log.error('Missing domainId');
    throw new errors.InternalServerError();
  }

  const playerService = new PlayerService(domainId);

  const possiblePlayers = await playerService.find({
    search: {
      name: [input],
      steamId: [input],
      epicOnlineServicesId: [input],
      xboxLiveId: [input],
    },
    extend: ['playerOnGameServers'],
  });

  let filteredByGameServer = possiblePlayers.results
    .map((p) => {
      if (!p.playerOnGameServers || !p.playerOnGameServers.length) return null;
      return p.playerOnGameServers.filter((pog) => pog.gameServerId === gameServerId);
    })
    .filter((pogs) => pogs !== null && pogs.length > 0)
    .flat();

  if (onlineOnly) {
    filteredByGameServer = filteredByGameServer.filter((pog) => pog !== null && pog.online === true);
  }

  if (filteredByGameServer.length === 0) {
    const notFoundMsg = onlineOnly
      ? `No online player found with the name or ID "${input}"`
      : `No player found with the name or ID "${input}"`;
    throw new errors.NotFoundError(notFoundMsg);
  }

  if (filteredByGameServer.length > 1) {
    const multipleFoundMsg = onlineOnly
      ? `Multiple online players found with the name or ID "${input}"`
      : `Multiple players found with the name or ID "${input}"`;
    throw new errors.BadRequestError(multipleFoundMsg);
  }

  if (!filteredByGameServer[0]) {
    throw new errors.NotFoundError(`No player found with the name or ID "${input}"`);
  }

  const playerOnGameServerService = new PlayerOnGameServerService(domainId);

  return playerOnGameServerService.findOne(filteredByGameServer[0].id);
}
