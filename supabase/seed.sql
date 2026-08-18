-- =========================================================================
-- Digital QR Menu — OPTIONAL demo data
--
-- This file is entirely optional. The menu works perfectly with zero rows
-- (it will just show an empty state until the admin adds real categories
-- and items from the Dashboard). Run this only if you want a couple of
-- sample categories/items to see the layout before adding real content.
--
-- Safe to run multiple times — it checks for existing rows first.
-- =========================================================================

do $$
declare
  v_hot_drinks   uuid;
  v_cold_drinks  uuid;
  v_desserts     uuid;
begin
  if (select count(*) from public.categories) = 0 then

    insert into public.categories (name_ku, name_ar, name_en, sort_order)
    values ('خواردنەوە گەرم', 'مشروبات ساخنة', 'Hot Drinks', 1)
    returning id into v_hot_drinks;

    insert into public.categories (name_ku, name_ar, name_en, sort_order)
    values ('خواردنەوە سارد', 'مشروبات باردة', 'Cold Drinks', 2)
    returning id into v_cold_drinks;

    insert into public.categories (name_ku, name_ar, name_en, sort_order)
    values ('شیرینی', 'حلويات', 'Desserts', 3)
    returning id into v_desserts;

    insert into public.menu_items
      (category_id, name_ku, name_ar, name_en, description_ku, description_ar, description_en, price, sort_order, is_available)
    values
      (v_hot_drinks, 'قاوەی تورکی', 'قهوة تركية', 'Turkish Coffee',
       'قاوەی تورکیی نەریتی', 'قهوة تركية تقليدية', 'Traditional Turkish coffee',
       3000, 1, true),
      (v_hot_drinks, 'کاپوچینۆ', 'كابتشينو', 'Cappuccino',
       'لەگەڵ کۆپی نەرم', 'مع رغوة ناعمة', 'With smooth milk foam',
       4000, 2, true),
      (v_cold_drinks, 'ئایس لاتێ', 'آيس لاتيه', 'Iced Latte',
       'قاوەی سارد لەگەڵ شیر', 'قهوة باردة مع حليب', 'Cold coffee with milk',
       4500, 1, true),
      (v_desserts, 'کێیکی چۆکلێت', 'كيك الشوكولاتة', 'Chocolate Cake',
       'کێیکی نەرم و تامدار', 'كيكة طرية ولذيذة', 'Soft and rich cake',
       5000, 1, true);

  end if;
end $$;
