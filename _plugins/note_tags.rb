# _plugins/note_tags.rb
# 默认情况下 Jekyll 的 site.tags 只汇总 _posts 里的文章标签，不含 _notes 集合的标签。
# 本插件把笔记的标签也合并进 site.tags，使 tags.html / blog.html 的标签索引同样展示笔记标签；
# 同时规范化标签：去掉 Obsidian 风格的 "#" 前缀与首尾空白。

module NoteTags
  class NoteTagGenerator < Jekyll::Generator
    safe true
    priority :low

    def generate(site)
      notes = site.collections['notes']
      return unless notes

      tags = site.tags
      notes.docs.each do |doc|
        raw = doc.data['tags']
        raw = raw.is_a?(Array) ? raw : [raw]
        clean = raw.compact.map { |t| t.to_s.sub(/\A#+/, '').strip }.reject(&:empty?)
        doc.data['tags'] = clean

        clean.each do |tag|
          (tags[tag] ||= []) << doc
        end
      end
    end
  end
end
