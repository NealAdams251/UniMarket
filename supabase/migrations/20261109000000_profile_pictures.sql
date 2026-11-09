alter table public.profiles add column if not exists avatar_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-pictures', 'profile-pictures', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "Upload own profile pictures" on storage.objects
for insert to authenticated
with check (bucket_id = 'profile-pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Read own profile picture objects" on storage.objects
for select to authenticated
using (bucket_id = 'profile-pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Delete own profile pictures" on storage.objects
for delete to authenticated
using (bucket_id = 'profile-pictures' and (storage.foldername(name))[1] = (select auth.uid())::text);