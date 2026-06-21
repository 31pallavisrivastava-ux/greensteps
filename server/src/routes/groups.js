import { joinCodeSchema } from '../lib/schemas/common.js'
import {
  createClassGroup,
  joinClassGroup,
  listUserGroups,
  getGroupLeaderboard,
} from '../modules/groups/engine.js'
import { createJoinableGroupRouter } from './joinableGroup.js'

export const groupsRouter = createJoinableGroupRouter({
  joinSchema: joinCodeSchema,
  viewPath: '/:id/leaderboard',
  list: listUserGroups,
  create: createClassGroup,
  join: (prisma, userId, body) => joinClassGroup(prisma, userId, body.joinCode),
  getView: getGroupLeaderboard,
  formatCreated: (group) => ({
    id: group.id,
    name: group.name,
    joinCode: group.joinCode,
    memberCount: group.members.length,
  }),
  formatJoined: (result) => ({
    id: result.group.id,
    name: result.group.name,
    joinCode: result.group.joinCode,
  }),
})
