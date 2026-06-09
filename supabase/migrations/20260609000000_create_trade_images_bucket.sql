-- Create a public storage bucket for trade chart images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trade-images',
  'trade-images',
  true,
  10485760, -- 10 MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images to the bucket
CREATE POLICY "Authenticated users can upload trade images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'trade-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Users can update their own trade images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to delete their own images
CREATE POLICY "Users can delete their own trade images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to all images in the bucket
CREATE POLICY "Public can read trade images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'trade-images');
