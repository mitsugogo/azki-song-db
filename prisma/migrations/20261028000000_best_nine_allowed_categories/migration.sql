-- 既存のお題はNULLのまま、アプリケーション側で全カテゴリとして扱う。
ALTER TABLE `BestNineTopicRevision` ADD COLUMN `slotCategories` JSON NULL;
