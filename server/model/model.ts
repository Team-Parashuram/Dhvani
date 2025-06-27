import mongoose, { Model } from 'mongoose';
import { AdminSchema, IAdmin } from './schema/admin.schema';
import { UserSchema, IUser } from './schema/user.schema';
import { InventorySchema, IInventory } from './schema/inventory.schema';
import {
  OrganisationSchema,
  IOrganisation,
} from './schema/organisation.schema';


const Admin: Model<IAdmin> = mongoose.model<IAdmin>('Admin', AdminSchema);
const User: Model<IUser> = mongoose.model<IUser>(
  'User',
  UserSchema
);
const Inventory: Model<IInventory> = mongoose.model<IInventory>(
  'Inventory',
  InventorySchema
);
const Organisation: Model<IOrganisation> = mongoose.model<IOrganisation>(
  'Organisation',
  OrganisationSchema
);

export {
  Organisation,
  User,
  Admin,
  Inventory,
};
