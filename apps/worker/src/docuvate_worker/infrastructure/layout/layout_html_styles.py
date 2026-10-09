"""Shared CSS for layout IR HTML preview (embedded in iframe srcDoc)."""

LAYOUT_HTML_HEAD = """
<style>
html, body {
  margin: 0;
  padding: 0;
  background: transparent;
  font-family: "Liberation Sans", Arial, Helvetica, sans-serif;
}
.layout-root {
  margin: 0;
  font-family: "Liberation Sans", Arial, Helvetica, sans-serif;
}
.page {
  position: relative;
  margin: 0 auto 12pt;
  background: #fff;
  box-shadow: 0 0 8px rgba(0,0,0,.12);
  font-family: "Liberation Sans", Arial, Helvetica, sans-serif;
  overflow: visible;
}
.run {
  display: inline-block;
  font-family: "Liberation Sans", Arial, Helvetica, sans-serif;
  overflow: visible;
  line-height: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.widget {
  font-family: "Liberation Sans", Arial, Helvetica, sans-serif;
  overflow: visible;
  line-height: 0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
"""
