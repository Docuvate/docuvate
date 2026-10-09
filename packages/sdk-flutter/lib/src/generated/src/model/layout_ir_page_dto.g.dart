// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'layout_ir_page_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$LayoutIrPageDto extends LayoutIrPageDto {
  @override
  final num page;
  @override
  final num widthPt;
  @override
  final num heightPt;
  @override
  final BuiltList<LayoutIrBlockDto> blocks;
  @override
  final BuiltList<LayoutIrLineDto>? lines;
  @override
  final BuiltList<LayoutIrTableDto>? tables;
  @override
  final BuiltList<LayoutIrVectorDto>? vectors;
  @override
  final BuiltList<LayoutIrWidgetDto>? widgets;

  factory _$LayoutIrPageDto([void Function(LayoutIrPageDtoBuilder)? updates]) =>
      (new LayoutIrPageDtoBuilder()..update(updates))._build();

  _$LayoutIrPageDto._(
      {required this.page,
      required this.widthPt,
      required this.heightPt,
      required this.blocks,
      this.lines,
      this.tables,
      this.vectors,
      this.widgets})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(page, r'LayoutIrPageDto', 'page');
    BuiltValueNullFieldError.checkNotNull(
        widthPt, r'LayoutIrPageDto', 'widthPt');
    BuiltValueNullFieldError.checkNotNull(
        heightPt, r'LayoutIrPageDto', 'heightPt');
    BuiltValueNullFieldError.checkNotNull(blocks, r'LayoutIrPageDto', 'blocks');
  }

  @override
  LayoutIrPageDto rebuild(void Function(LayoutIrPageDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LayoutIrPageDtoBuilder toBuilder() =>
      new LayoutIrPageDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LayoutIrPageDto &&
        page == other.page &&
        widthPt == other.widthPt &&
        heightPt == other.heightPt &&
        blocks == other.blocks &&
        lines == other.lines &&
        tables == other.tables &&
        vectors == other.vectors &&
        widgets == other.widgets;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, widthPt.hashCode);
    _$hash = $jc(_$hash, heightPt.hashCode);
    _$hash = $jc(_$hash, blocks.hashCode);
    _$hash = $jc(_$hash, lines.hashCode);
    _$hash = $jc(_$hash, tables.hashCode);
    _$hash = $jc(_$hash, vectors.hashCode);
    _$hash = $jc(_$hash, widgets.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LayoutIrPageDto')
          ..add('page', page)
          ..add('widthPt', widthPt)
          ..add('heightPt', heightPt)
          ..add('blocks', blocks)
          ..add('lines', lines)
          ..add('tables', tables)
          ..add('vectors', vectors)
          ..add('widgets', widgets))
        .toString();
  }
}

class LayoutIrPageDtoBuilder
    implements Builder<LayoutIrPageDto, LayoutIrPageDtoBuilder> {
  _$LayoutIrPageDto? _$v;

  num? _page;
  num? get page => _$this._page;
  set page(num? page) => _$this._page = page;

  num? _widthPt;
  num? get widthPt => _$this._widthPt;
  set widthPt(num? widthPt) => _$this._widthPt = widthPt;

  num? _heightPt;
  num? get heightPt => _$this._heightPt;
  set heightPt(num? heightPt) => _$this._heightPt = heightPt;

  ListBuilder<LayoutIrBlockDto>? _blocks;
  ListBuilder<LayoutIrBlockDto> get blocks =>
      _$this._blocks ??= new ListBuilder<LayoutIrBlockDto>();
  set blocks(ListBuilder<LayoutIrBlockDto>? blocks) => _$this._blocks = blocks;

  ListBuilder<LayoutIrLineDto>? _lines;
  ListBuilder<LayoutIrLineDto> get lines =>
      _$this._lines ??= new ListBuilder<LayoutIrLineDto>();
  set lines(ListBuilder<LayoutIrLineDto>? lines) => _$this._lines = lines;

  ListBuilder<LayoutIrTableDto>? _tables;
  ListBuilder<LayoutIrTableDto> get tables =>
      _$this._tables ??= new ListBuilder<LayoutIrTableDto>();
  set tables(ListBuilder<LayoutIrTableDto>? tables) => _$this._tables = tables;

  ListBuilder<LayoutIrVectorDto>? _vectors;
  ListBuilder<LayoutIrVectorDto> get vectors =>
      _$this._vectors ??= new ListBuilder<LayoutIrVectorDto>();
  set vectors(ListBuilder<LayoutIrVectorDto>? vectors) =>
      _$this._vectors = vectors;

  ListBuilder<LayoutIrWidgetDto>? _widgets;
  ListBuilder<LayoutIrWidgetDto> get widgets =>
      _$this._widgets ??= new ListBuilder<LayoutIrWidgetDto>();
  set widgets(ListBuilder<LayoutIrWidgetDto>? widgets) =>
      _$this._widgets = widgets;

  LayoutIrPageDtoBuilder() {
    LayoutIrPageDto._defaults(this);
  }

  LayoutIrPageDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _page = $v.page;
      _widthPt = $v.widthPt;
      _heightPt = $v.heightPt;
      _blocks = $v.blocks.toBuilder();
      _lines = $v.lines?.toBuilder();
      _tables = $v.tables?.toBuilder();
      _vectors = $v.vectors?.toBuilder();
      _widgets = $v.widgets?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LayoutIrPageDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$LayoutIrPageDto;
  }

  @override
  void update(void Function(LayoutIrPageDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LayoutIrPageDto build() => _build();

  _$LayoutIrPageDto _build() {
    _$LayoutIrPageDto _$result;
    try {
      _$result = _$v ??
          new _$LayoutIrPageDto._(
              page: BuiltValueNullFieldError.checkNotNull(
                  page, r'LayoutIrPageDto', 'page'),
              widthPt: BuiltValueNullFieldError.checkNotNull(
                  widthPt, r'LayoutIrPageDto', 'widthPt'),
              heightPt: BuiltValueNullFieldError.checkNotNull(
                  heightPt, r'LayoutIrPageDto', 'heightPt'),
              blocks: blocks.build(),
              lines: _lines?.build(),
              tables: _tables?.build(),
              vectors: _vectors?.build(),
              widgets: _widgets?.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'blocks';
        blocks.build();
        _$failedField = 'lines';
        _lines?.build();
        _$failedField = 'tables';
        _tables?.build();
        _$failedField = 'vectors';
        _vectors?.build();
        _$failedField = 'widgets';
        _widgets?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'LayoutIrPageDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
