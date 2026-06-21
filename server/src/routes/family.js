import { familyJoinSchema } from '../lib/schemas/common.js'
import {
  createFamilyGroup,
  joinFamilyGroup,
  listUserFamilies,
  getFamilyDashboard,
} from '../modules/family/engine.js'
import { createJoinableGroupRouter } from './joinableGroup.js'

export const familyRouter = createJoinableGroupRouter({
  joinSchema: familyJoinSchema,
  viewPath: '/:id/dashboard',
  list: listUserFamilies,
  create: createFamilyGroup,
  join: (prisma, userId, body) =>
    joinFamilyGroup(prisma, userId, body.joinCode, body.role ?? 'ADULT'),
  getView: getFamilyDashboard,
  formatCreated: (family) => ({
    id: family.id,
    name: family.name,
    joinCode: family.joinCode,
    memberCount: family.members.length,
    role: 'OWNER',
  }),
  formatJoined: (result) => ({
    id: result.family.id,
    name: result.family.name,
    joinCode: result.family.joinCode,
  }),
})
