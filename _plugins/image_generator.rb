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
      imgs_dir = File.join(site.source, '_posts', 'imgs')
      return unless Dir.exist?(imgs_dir)

      # Find all image files in _posts/imgs/
      image_extensions = %w[.png .jpg .jpeg .gif .svg .webp .bmp .ico]
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
        # Override the destination to be /imgs/ instead of /_posts/imgs/
        def static_file.destination(dest)
          File.join(dest, 'imgs', @name)
        end

        site.static_files << static_file
      end
    end
  end
end
