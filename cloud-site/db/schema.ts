import {sqliteTable,text,integer,primaryKey} from 'drizzle-orm/sqlite-core';
export const teams=sqliteTable('teams',{id:integer('id').primaryKey(),group_id:integer('group_id').notNull(),position:integer('position').notNull(),name:text('name').notNull(),song:text('song').notNull(),members:text('members').notNull(),photo:text('photo').notNull()});
export const rounds=sqliteTable('rounds',{id:integer('id').primaryKey(),status:text('status').notNull().default('ready'),winner:integer('winner')});
export const google_voters=sqliteTable('google_voters',{hash:text('hash').primaryKey(),name:text('name').notNull(),email:text('email').notNull()});
export const sessions=sqliteTable('sessions',{token:text('token').primaryKey(),kind:text('kind').notNull(),identity:text('identity').notNull(),expires:integer('expires').notNull()});
export const votes=sqliteTable('votes',{round:integer('round').notNull(),voter:text('voter').notNull(),team:integer('team').notNull()},t=>[primaryKey({columns:[t.round,t.voter]})]);
export const rate_limits=sqliteTable('rate_limits',{key:text('key').primaryKey(),count:integer('count').notNull(),expires:integer('expires').notNull()});