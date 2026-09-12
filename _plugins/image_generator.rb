# _plugins/image_generator.rb
# Registers images from _posts/imgs/ as Jekyll static files so they are
# copied into _site/imgs/ during build and served at /imgs/filename.
#
# This solves the problem that Jekyll does not serve files from
# underscore-prefixed directories (_posts/) by default.

module ObsidianImages
  class ImageGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      # Find all image files under any imgs/ directory (at any depth) inside
      # _posts/ and _notes/, serving them at /imgs/filename.
      #
      # Notes are grouped in category subfolders (e.g. _notes/Tryhackme/imgs/,
      # _notes/hackmyvm/imgs/), so we must recurse rather than only look at
      # _notes/imgs/ and _posts/imgs/.
      image_extensions = %w[.png .jpg .jpeg .gif .svg .webp .bmp .ico]
      %w[_posts _notes].each do |collection_dir|
        base = File.join(site.source, collection_dir)
        next unless Dir.exist?(base)

        Dir.glob(File.join(base, '**', 'imgs')).each do |imgs_dir|
          Dir.foreach(imgs_dir) do |filename|
            next if filename == '.' || filename == '..'
            next unless image_extensions.include?(File.extname(filename).downcase)

            # Create a StaticFile that Jekyll will copy to _site/imgs/
            static_file = Jekyll::StaticFile.new(
              site,
              imgs_dir,        # base directory
              '',              # subdirectory within base
              filename         # file name
            )
            # Override the destination to be /imgs/ instead of the source subfolder.
            def static_file.destination(dest)
              File.join(dest, 'imgs', @name)
            end

            site.static_files << static_file
          end
        end
      end
    end
  end
end
