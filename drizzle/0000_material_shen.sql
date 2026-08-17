CREATE TABLE `participants` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_code` text NOT NULL,
	`name` text NOT NULL,
	`score` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`active` text DEFAULT 'Hızlı Quiz' NOT NULL
);
