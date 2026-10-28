// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_widget_document_previews_response_dto_class.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DashboardWidgetDocumentPreviewsResponseDtoClass
    extends DashboardWidgetDocumentPreviewsResponseDtoClass {
  @override
  final BuiltList<JsonObject> items;
  @override
  final num? attentionCount;

  factory _$DashboardWidgetDocumentPreviewsResponseDtoClass(
          [void Function(
                  DashboardWidgetDocumentPreviewsResponseDtoClassBuilder)?
              updates]) =>
      (new DashboardWidgetDocumentPreviewsResponseDtoClassBuilder()
            ..update(updates))
          ._build();

  _$DashboardWidgetDocumentPreviewsResponseDtoClass._(
      {required this.items, this.attentionCount})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'DashboardWidgetDocumentPreviewsResponseDtoClass', 'items');
  }

  @override
  DashboardWidgetDocumentPreviewsResponseDtoClass rebuild(
          void Function(DashboardWidgetDocumentPreviewsResponseDtoClassBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DashboardWidgetDocumentPreviewsResponseDtoClassBuilder toBuilder() =>
      new DashboardWidgetDocumentPreviewsResponseDtoClassBuilder()
        ..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DashboardWidgetDocumentPreviewsResponseDtoClass &&
        items == other.items &&
        attentionCount == other.attentionCount;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jc(_$hash, attentionCount.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'DashboardWidgetDocumentPreviewsResponseDtoClass')
          ..add('items', items)
          ..add('attentionCount', attentionCount))
        .toString();
  }
}

class DashboardWidgetDocumentPreviewsResponseDtoClassBuilder
    implements
        Builder<DashboardWidgetDocumentPreviewsResponseDtoClass,
            DashboardWidgetDocumentPreviewsResponseDtoClassBuilder> {
  _$DashboardWidgetDocumentPreviewsResponseDtoClass? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= new ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  num? _attentionCount;
  num? get attentionCount => _$this._attentionCount;
  set attentionCount(num? attentionCount) =>
      _$this._attentionCount = attentionCount;

  DashboardWidgetDocumentPreviewsResponseDtoClassBuilder() {
    DashboardWidgetDocumentPreviewsResponseDtoClass._defaults(this);
  }

  DashboardWidgetDocumentPreviewsResponseDtoClassBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _attentionCount = $v.attentionCount;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DashboardWidgetDocumentPreviewsResponseDtoClass other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DashboardWidgetDocumentPreviewsResponseDtoClass;
  }

  @override
  void update(
      void Function(DashboardWidgetDocumentPreviewsResponseDtoClassBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  DashboardWidgetDocumentPreviewsResponseDtoClass build() => _build();

  _$DashboardWidgetDocumentPreviewsResponseDtoClass _build() {
    _$DashboardWidgetDocumentPreviewsResponseDtoClass _$result;
    try {
      _$result = _$v ??
          new _$DashboardWidgetDocumentPreviewsResponseDtoClass._(
              items: items.build(), attentionCount: attentionCount);
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DashboardWidgetDocumentPreviewsResponseDtoClass',
            _$failedField,
            e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
