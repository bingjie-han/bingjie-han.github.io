# _plugins/note_categories.rb
# Derives each note's category from its subfolder under _notes/, so that
#   _notes/SQL注入/xxx.md  ->  category: "SQL注入"
#   _notes/xxx.md           ->  category: "未分类"
# The notes.html page then groups site.notes by this `category` field.

Jekyll::Hooks.register :site, :post_read do |site|
  notes = site.collections['notes']
  next unless notes

  notes.docs.each do |doc|
    rel = doc.relative_path.to_s.tr('\\', '/').sub(%r{^_notes/}, '')
    parts = rel.split('/')
    doc.data['category'] = parts.size >= 2 ? parts[0] : '未分类'
  end
end
