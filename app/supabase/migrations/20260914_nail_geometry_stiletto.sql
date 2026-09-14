-- nail_geometry_variants.shape's check constraint still only allowed the original 4 shapes
-- ('oval','square','coffin','almond') — publishing a calibration for the new 'stiletto' shape
-- from /admin/geometry failed with "violates check constraint
-- nail_geometry_variants_shape_check". Widen it to include 'stiletto'. Idempotent.
alter table public.nail_geometry_variants drop constraint if exists nail_geometry_variants_shape_check;
alter table public.nail_geometry_variants add constraint nail_geometry_variants_shape_check
  check (shape in ('oval', 'square', 'coffin', 'almond', 'stiletto'));
