# _plugins/obsidian_images.rb
# Converts Obsidian wiki-link image syntax ![[image.png]] to standard Markdown
# Runs before kramdown processes the post content.
#
# Supports:
#   - ![[image.png]]         → ![image.png](/imgs/image.png)
#   - ![[Pasted image 1.png]] → ![Pasted image 1.png](/imgs/Pasted image 1.png)
#   - ![[中文图片名.png]]      → ![中文图片名.png](/imgs/中文图片名.png)

Jekyll::Hooks.register :posts, :pre_render do |post|
  # Match ![[...]] where ... is the image filename (can contain spaces, Chinese, etc.)
  post.content = post.content.gsub(/!\[\[([^\]]+)\]\]/) do |_match|
    filename = $1.strip
    # Use the filename as alt text, and reference /imgs/ for the served path
    "![#{filename}](/imgs/#{filename})"
  end
end

# Also handle pages (non-post markdown files)
Jekyll::Hooks.register :pages, :pre_render do |page|
  next unless page.extname == '.md' || page.extname == '.markdown'
  page.content = page.content.gsub(/!\[\[([^\]]+)\]\]/) do |_match|
    filename = $1.strip
    "![#{filename}](/imgs/#{filename})"
  end
end
