(function () {
  'use strict';

  var SEARCH_INDEX_URL = '/search_index.json';

  var input = document.getElementById('search-input');
  var resultsContainer = document.getElementById('search-results');
  var statsContainer = document.getElementById('search-stats');

  var index = [];
  var loaded = false;
  var loadError = false;
  var selectedIndex = -1;
  var currentResults = [];
  var debounceTimer = null;

  function loadIndex() {
    if (loaded || loadError) return;
    input.disabled = true;
    input.placeholder = '正在加载搜索索引...';
    fetch(SEARCH_INDEX_URL)
      .then(function (response) {
        if (!response.ok) throw new Error('Index fetch failed: ' + response.status);
        return response.json();
      })
      .then(function (data) {
        index = data || [];
        loaded = true;
        input.disabled = false;
        input.placeholder = '输入关键词搜索文章...';
        input.focus();
      })
      .catch(function () {
        loadError = true;
        input.disabled = true;
        input.placeholder = '搜索索引加载失败，请刷新页面重试';
        resultsContainer.innerHTML = '<article class="empty-state"><h3>索引加载失败</h3><p>搜索功能暂时无法使用，请稍后刷新页面重试。</p></article>';
        statsContainer.textContent = '';
      });
  }

  function normalize(str) {
    return (str || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function matchTerms(text, terms) {
    var normalized = normalize(text);
    for (var i = 0; i < terms.length; i++) {
      if (normalized.indexOf(terms[i]) === -1) return false;
    }
    return true;
  }

  function scoreResult(post, terms) {
    var title = normalize(post.title);
    var subtitle = normalize(post.subtitle || '');
    var tags = normalize((post.tags || []).join(' '));
    var content = normalize(post.content || '');
    var excerpt = normalize(post.excerpt || '');
    var score = 0;
    for (var i = 0; i < terms.length; i++) {
      var term = terms[i];
      if (title.indexOf(term) !== -1) score += 30;
      if (subtitle.indexOf(term) !== -1) score += 12;
      if (tags.indexOf(term) !== -1) score += 18;
      var escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var contentMatches = (content.match(new RegExp(escapedTerm, 'g')) || []).length;
      score += Math.min(contentMatches * 2, 20);
      if (excerpt.indexOf(term) !== -1) score += 5;
    }
    return score;
  }

  function highlightText(text, term) {
    var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>');
  }

  function highlightMultiple(text, terms) {
    var result = text;
    for (var i = 0; i < terms.length; i++) {
      result = highlightText(result, terms[i]);
    }
    return result;
  }

  function buildResultHTML(post, terms) {
    var titleHighlighted = highlightMultiple(post.title, terms);
    var excerptSource = post.subtitle || post.excerpt || '';
    var excerptHighlighted = highlightMultiple(excerptSource, terms);
    if (excerptHighlighted.length > 220) {
      excerptHighlighted = excerptHighlighted.substring(0, 200) + '...';
    }
    var tagsHTML = '';
    if (post.tags && post.tags.length > 0) {
      tagsHTML = '<div class="post-card-tags">';
      for (var i = 0; i < Math.min(post.tags.length, 4); i++) {
        tagsHTML += '<span>' + highlightMultiple(post.tags[i], terms) + '</span>';
      }
      tagsHTML += '</div>';
    }
    return (
      '<a class="search-result-item reveal" href="' + post.url + '">' +
        '<time datetime="' + post.date + '">' + (post.date || '') + '</time>' +
        '<div>' +
          '<h3>' + titleHighlighted + '</h3>' +
          '<p>' + excerptHighlighted + '</p>' +
          tagsHTML +
        '</div>' +
      '</a>'
    );
  }

  function renderResults(results, terms) {
    selectedIndex = -1;
    if (results.length === 0) {
      statsContainer.textContent = '';
      resultsContainer.innerHTML = '<article class="empty-state"><h3>没有找到相关文章</h3><p>试试其他关键词，或者浏览<a href=\"/blog/\">文章目录</a>。</p></article>';
      return;
    }
    statsContainer.textContent = '找到 ' + results.length + ' 篇相关文章';
    var html = '';
    for (var i = 0; i < results.length; i++) {
      html += buildResultHTML(results[i], terms);
    }
    resultsContainer.innerHTML = html;
    var reveals = resultsContainer.querySelectorAll('.reveal');
    for (var r = 0; r < reveals.length; r++) {
      reveals[r].classList.add('is-visible');
    }
  }

  function showHint() {
    selectedIndex = -1;
    currentResults = [];
    statsContainer.textContent = '';
    resultsContainer.innerHTML = (
      '<div class="search-hint">' +
        '<p>输入关键词开始搜索</p>' +
        '<p class="search-hint-tags">' +
          '试试: ' +
          '<a class="search-chip" href="?q=博客">博客</a>' +
          '<a class="search-chip" href="?q=生活">生活</a>' +
          '<a class="search-chip" href="?q=梦想">梦想</a>' +
        '</p>' +
      '</div>'
    );
  }

  function doSearch(query) {
    if (!query || query.trim() === '') {
      showHint();
      return;
    }
    if (!loaded || loadError) return;
    var trimmed = query.trim();
    var terms = trimmed.toLowerCase().split(/\s+/).filter(function (t) { return t.length > 0; });
    if (terms.length === 0) {
      showHint();
      return;
    }
    var matched = [];
    for (var i = 0; i < index.length; i++) {
      var post = index[i];
      var searchText = [
        post.title || '',
        post.subtitle || '',
        (post.tags || []).join(' '),
        post.content || ''
      ].join(' ');
      if (matchTerms(searchText, terms)) {
        post._score = scoreResult(post, terms);
        matched.push(post);
      }
    }
    matched.sort(function (a, b) { return b._score - a._score; });
    currentResults = matched;
    renderResults(matched, terms);
  }

  function onInput() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      doSearch(input.value);
    }, 200);
  }

  function onKeyDown(e) {
    var items = resultsContainer.querySelectorAll('.search-result-item');
    if (items.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      updateSelection(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      updateSelection(items);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        items[selectedIndex].click();
      }
    } else if (e.key === 'Escape') {
      input.value = '';
      input.blur();
      showHint();
    }
  }

  function updateSelection(items) {
    for (var i = 0; i < items.length; i++) {
      items[i].classList.remove('is-selected');
    }
    if (selectedIndex >= 0 && selectedIndex < items.length) {
      items[selectedIndex].classList.add('is-selected');
      items[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  function initSearch() {
    if (!input || !resultsContainer) return;
    var params = new URLSearchParams(window.location.search);
    var queryParam = params.get('q');
    if (queryParam) {
      input.value = queryParam;
    }
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', onKeyDown);
    loadIndex();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
})();
