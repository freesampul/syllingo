import {sqliteTable,text,integer} from "drizzle-orm/sqlite-core";
export const entries=sqliteTable("entries",{id:text("id").primaryKey(),data:text("data").notNull()});
export const reviews=sqliteTable("reviews",{id:text("id").primaryKey(),due:integer("due").notNull(),days:integer("days").notNull(),reviews:integer("reviews").notNull()});
