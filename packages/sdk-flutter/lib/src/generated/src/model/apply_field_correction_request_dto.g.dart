// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'apply_field_correction_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ApplyFieldCorrectionRequestDtoOpEnum
    _$applyFieldCorrectionRequestDtoOpEnum_create =
    const ApplyFieldCorrectionRequestDtoOpEnum._('create');
const ApplyFieldCorrectionRequestDtoOpEnum
    _$applyFieldCorrectionRequestDtoOpEnum_reanchor =
    const ApplyFieldCorrectionRequestDtoOpEnum._('reanchor');
const ApplyFieldCorrectionRequestDtoOpEnum
    _$applyFieldCorrectionRequestDtoOpEnum_editValue =
    const ApplyFieldCorrectionRequestDtoOpEnum._('editValue');
const ApplyFieldCorrectionRequestDtoOpEnum
    _$applyFieldCorrectionRequestDtoOpEnum_remove =
    const ApplyFieldCorrectionRequestDtoOpEnum._('remove');
const ApplyFieldCorrectionRequestDtoOpEnum
    _$applyFieldCorrectionRequestDtoOpEnum_rejectSuggestion =
    const ApplyFieldCorrectionRequestDtoOpEnum._('rejectSuggestion');

ApplyFieldCorrectionRequestDtoOpEnum
    _$applyFieldCorrectionRequestDtoOpEnumValueOf(String name) {
  switch (name) {
    case 'create':
      return _$applyFieldCorrectionRequestDtoOpEnum_create;
    case 'reanchor':
      return _$applyFieldCorrectionRequestDtoOpEnum_reanchor;
    case 'editValue':
      return _$applyFieldCorrectionRequestDtoOpEnum_editValue;
    case 'remove':
      return _$applyFieldCorrectionRequestDtoOpEnum_remove;
    case 'rejectSuggestion':
      return _$applyFieldCorrectionRequestDtoOpEnum_rejectSuggestion;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ApplyFieldCorrectionRequestDtoOpEnum>
    _$applyFieldCorrectionRequestDtoOpEnumValues = BuiltSet<
        ApplyFieldCorrectionRequestDtoOpEnum>(const <ApplyFieldCorrectionRequestDtoOpEnum>[
  _$applyFieldCorrectionRequestDtoOpEnum_create,
  _$applyFieldCorrectionRequestDtoOpEnum_reanchor,
  _$applyFieldCorrectionRequestDtoOpEnum_editValue,
  _$applyFieldCorrectionRequestDtoOpEnum_remove,
  _$applyFieldCorrectionRequestDtoOpEnum_rejectSuggestion,
]);

const ApplyFieldCorrectionRequestDtoShapeEnum
    _$applyFieldCorrectionRequestDtoShapeEnum_rect =
    const ApplyFieldCorrectionRequestDtoShapeEnum._('rect');
const ApplyFieldCorrectionRequestDtoShapeEnum
    _$applyFieldCorrectionRequestDtoShapeEnum_polygon =
    const ApplyFieldCorrectionRequestDtoShapeEnum._('polygon');

ApplyFieldCorrectionRequestDtoShapeEnum
    _$applyFieldCorrectionRequestDtoShapeEnumValueOf(String name) {
  switch (name) {
    case 'rect':
      return _$applyFieldCorrectionRequestDtoShapeEnum_rect;
    case 'polygon':
      return _$applyFieldCorrectionRequestDtoShapeEnum_polygon;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ApplyFieldCorrectionRequestDtoShapeEnum>
    _$applyFieldCorrectionRequestDtoShapeEnumValues = BuiltSet<
        ApplyFieldCorrectionRequestDtoShapeEnum>(const <ApplyFieldCorrectionRequestDtoShapeEnum>[
  _$applyFieldCorrectionRequestDtoShapeEnum_rect,
  _$applyFieldCorrectionRequestDtoShapeEnum_polygon,
]);

const ApplyFieldCorrectionRequestDtoScopeEnum
    _$applyFieldCorrectionRequestDtoScopeEnum_document =
    const ApplyFieldCorrectionRequestDtoScopeEnum._('document');
const ApplyFieldCorrectionRequestDtoScopeEnum
    _$applyFieldCorrectionRequestDtoScopeEnum_label =
    const ApplyFieldCorrectionRequestDtoScopeEnum._('label');
const ApplyFieldCorrectionRequestDtoScopeEnum
    _$applyFieldCorrectionRequestDtoScopeEnum_always =
    const ApplyFieldCorrectionRequestDtoScopeEnum._('always');

ApplyFieldCorrectionRequestDtoScopeEnum
    _$applyFieldCorrectionRequestDtoScopeEnumValueOf(String name) {
  switch (name) {
    case 'document':
      return _$applyFieldCorrectionRequestDtoScopeEnum_document;
    case 'label':
      return _$applyFieldCorrectionRequestDtoScopeEnum_label;
    case 'always':
      return _$applyFieldCorrectionRequestDtoScopeEnum_always;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ApplyFieldCorrectionRequestDtoScopeEnum>
    _$applyFieldCorrectionRequestDtoScopeEnumValues = BuiltSet<
        ApplyFieldCorrectionRequestDtoScopeEnum>(const <ApplyFieldCorrectionRequestDtoScopeEnum>[
  _$applyFieldCorrectionRequestDtoScopeEnum_document,
  _$applyFieldCorrectionRequestDtoScopeEnum_label,
  _$applyFieldCorrectionRequestDtoScopeEnum_always,
]);

Serializer<ApplyFieldCorrectionRequestDtoOpEnum>
    _$applyFieldCorrectionRequestDtoOpEnumSerializer =
    _$ApplyFieldCorrectionRequestDtoOpEnumSerializer();
Serializer<ApplyFieldCorrectionRequestDtoShapeEnum>
    _$applyFieldCorrectionRequestDtoShapeEnumSerializer =
    _$ApplyFieldCorrectionRequestDtoShapeEnumSerializer();
Serializer<ApplyFieldCorrectionRequestDtoScopeEnum>
    _$applyFieldCorrectionRequestDtoScopeEnumSerializer =
    _$ApplyFieldCorrectionRequestDtoScopeEnumSerializer();

class _$ApplyFieldCorrectionRequestDtoOpEnumSerializer
    implements PrimitiveSerializer<ApplyFieldCorrectionRequestDtoOpEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'create': 'create',
    'reanchor': 'reanchor',
    'editValue': 'edit_value',
    'remove': 'remove',
    'rejectSuggestion': 'reject_suggestion',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'create': 'create',
    'reanchor': 'reanchor',
    'edit_value': 'editValue',
    'remove': 'remove',
    'reject_suggestion': 'rejectSuggestion',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ApplyFieldCorrectionRequestDtoOpEnum
  ];
  @override
  final String wireName = 'ApplyFieldCorrectionRequestDtoOpEnum';

  @override
  Object serialize(
          Serializers serializers, ApplyFieldCorrectionRequestDtoOpEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ApplyFieldCorrectionRequestDtoOpEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ApplyFieldCorrectionRequestDtoOpEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ApplyFieldCorrectionRequestDtoShapeEnumSerializer
    implements PrimitiveSerializer<ApplyFieldCorrectionRequestDtoShapeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'rect': 'rect',
    'polygon': 'polygon',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'rect': 'rect',
    'polygon': 'polygon',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ApplyFieldCorrectionRequestDtoShapeEnum
  ];
  @override
  final String wireName = 'ApplyFieldCorrectionRequestDtoShapeEnum';

  @override
  Object serialize(Serializers serializers,
          ApplyFieldCorrectionRequestDtoShapeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ApplyFieldCorrectionRequestDtoShapeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ApplyFieldCorrectionRequestDtoShapeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ApplyFieldCorrectionRequestDtoScopeEnumSerializer
    implements PrimitiveSerializer<ApplyFieldCorrectionRequestDtoScopeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'document': 'document',
    'label': 'label',
    'always': 'always',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'document': 'document',
    'label': 'label',
    'always': 'always',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ApplyFieldCorrectionRequestDtoScopeEnum
  ];
  @override
  final String wireName = 'ApplyFieldCorrectionRequestDtoScopeEnum';

  @override
  Object serialize(Serializers serializers,
          ApplyFieldCorrectionRequestDtoScopeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ApplyFieldCorrectionRequestDtoScopeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ApplyFieldCorrectionRequestDtoScopeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ApplyFieldCorrectionRequestDto extends ApplyFieldCorrectionRequestDto {
  @override
  final String id;
  @override
  final ApplyFieldCorrectionRequestDtoOpEnum op;
  @override
  final String fieldKey;
  @override
  final num? page;
  @override
  final ApplyFieldCorrectionRequestDtoShapeEnum? shape;
  @override
  final num? x0;
  @override
  final num? y0;
  @override
  final num? x1;
  @override
  final num? y1;
  @override
  final BuiltList<num>? blockIndexes;
  @override
  final String? valueOverride;
  @override
  final ApplyFieldCorrectionRequestDtoScopeEnum? scope;
  @override
  final String? tagId;
  @override
  final String? beforeRegionId;

  factory _$ApplyFieldCorrectionRequestDto(
          [void Function(ApplyFieldCorrectionRequestDtoBuilder)? updates]) =>
      (ApplyFieldCorrectionRequestDtoBuilder()..update(updates))._build();

  _$ApplyFieldCorrectionRequestDto._(
      {required this.id,
      required this.op,
      required this.fieldKey,
      this.page,
      this.shape,
      this.x0,
      this.y0,
      this.x1,
      this.y1,
      this.blockIndexes,
      this.valueOverride,
      this.scope,
      this.tagId,
      this.beforeRegionId})
      : super._();
  @override
  ApplyFieldCorrectionRequestDto rebuild(
          void Function(ApplyFieldCorrectionRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ApplyFieldCorrectionRequestDtoBuilder toBuilder() =>
      ApplyFieldCorrectionRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ApplyFieldCorrectionRequestDto &&
        id == other.id &&
        op == other.op &&
        fieldKey == other.fieldKey &&
        page == other.page &&
        shape == other.shape &&
        x0 == other.x0 &&
        y0 == other.y0 &&
        x1 == other.x1 &&
        y1 == other.y1 &&
        blockIndexes == other.blockIndexes &&
        valueOverride == other.valueOverride &&
        scope == other.scope &&
        tagId == other.tagId &&
        beforeRegionId == other.beforeRegionId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, op.hashCode);
    _$hash = $jc(_$hash, fieldKey.hashCode);
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, shape.hashCode);
    _$hash = $jc(_$hash, x0.hashCode);
    _$hash = $jc(_$hash, y0.hashCode);
    _$hash = $jc(_$hash, x1.hashCode);
    _$hash = $jc(_$hash, y1.hashCode);
    _$hash = $jc(_$hash, blockIndexes.hashCode);
    _$hash = $jc(_$hash, valueOverride.hashCode);
    _$hash = $jc(_$hash, scope.hashCode);
    _$hash = $jc(_$hash, tagId.hashCode);
    _$hash = $jc(_$hash, beforeRegionId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ApplyFieldCorrectionRequestDto')
          ..add('id', id)
          ..add('op', op)
          ..add('fieldKey', fieldKey)
          ..add('page', page)
          ..add('shape', shape)
          ..add('x0', x0)
          ..add('y0', y0)
          ..add('x1', x1)
          ..add('y1', y1)
          ..add('blockIndexes', blockIndexes)
          ..add('valueOverride', valueOverride)
          ..add('scope', scope)
          ..add('tagId', tagId)
          ..add('beforeRegionId', beforeRegionId))
        .toString();
  }
}

class ApplyFieldCorrectionRequestDtoBuilder
    implements
        Builder<ApplyFieldCorrectionRequestDto,
            ApplyFieldCorrectionRequestDtoBuilder> {
  _$ApplyFieldCorrectionRequestDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  ApplyFieldCorrectionRequestDtoOpEnum? _op;
  ApplyFieldCorrectionRequestDtoOpEnum? get op => _$this._op;
  set op(ApplyFieldCorrectionRequestDtoOpEnum? op) => _$this._op = op;

  String? _fieldKey;
  String? get fieldKey => _$this._fieldKey;
  set fieldKey(String? fieldKey) => _$this._fieldKey = fieldKey;

  num? _page;
  num? get page => _$this._page;
  set page(num? page) => _$this._page = page;

  ApplyFieldCorrectionRequestDtoShapeEnum? _shape;
  ApplyFieldCorrectionRequestDtoShapeEnum? get shape => _$this._shape;
  set shape(ApplyFieldCorrectionRequestDtoShapeEnum? shape) =>
      _$this._shape = shape;

  num? _x0;
  num? get x0 => _$this._x0;
  set x0(num? x0) => _$this._x0 = x0;

  num? _y0;
  num? get y0 => _$this._y0;
  set y0(num? y0) => _$this._y0 = y0;

  num? _x1;
  num? get x1 => _$this._x1;
  set x1(num? x1) => _$this._x1 = x1;

  num? _y1;
  num? get y1 => _$this._y1;
  set y1(num? y1) => _$this._y1 = y1;

  ListBuilder<num>? _blockIndexes;
  ListBuilder<num> get blockIndexes =>
      _$this._blockIndexes ??= ListBuilder<num>();
  set blockIndexes(ListBuilder<num>? blockIndexes) =>
      _$this._blockIndexes = blockIndexes;

  String? _valueOverride;
  String? get valueOverride => _$this._valueOverride;
  set valueOverride(String? valueOverride) =>
      _$this._valueOverride = valueOverride;

  ApplyFieldCorrectionRequestDtoScopeEnum? _scope;
  ApplyFieldCorrectionRequestDtoScopeEnum? get scope => _$this._scope;
  set scope(ApplyFieldCorrectionRequestDtoScopeEnum? scope) =>
      _$this._scope = scope;

  String? _tagId;
  String? get tagId => _$this._tagId;
  set tagId(String? tagId) => _$this._tagId = tagId;

  String? _beforeRegionId;
  String? get beforeRegionId => _$this._beforeRegionId;
  set beforeRegionId(String? beforeRegionId) =>
      _$this._beforeRegionId = beforeRegionId;

  ApplyFieldCorrectionRequestDtoBuilder() {
    ApplyFieldCorrectionRequestDto._defaults(this);
  }

  ApplyFieldCorrectionRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _op = $v.op;
      _fieldKey = $v.fieldKey;
      _page = $v.page;
      _shape = $v.shape;
      _x0 = $v.x0;
      _y0 = $v.y0;
      _x1 = $v.x1;
      _y1 = $v.y1;
      _blockIndexes = $v.blockIndexes?.toBuilder();
      _valueOverride = $v.valueOverride;
      _scope = $v.scope;
      _tagId = $v.tagId;
      _beforeRegionId = $v.beforeRegionId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ApplyFieldCorrectionRequestDto other) {
    _$v = other as _$ApplyFieldCorrectionRequestDto;
  }

  @override
  void update(void Function(ApplyFieldCorrectionRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ApplyFieldCorrectionRequestDto build() => _build();

  _$ApplyFieldCorrectionRequestDto _build() {
    _$ApplyFieldCorrectionRequestDto _$result;
    try {
      _$result = _$v ??
          _$ApplyFieldCorrectionRequestDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'ApplyFieldCorrectionRequestDto', 'id'),
            op: BuiltValueNullFieldError.checkNotNull(
                op, r'ApplyFieldCorrectionRequestDto', 'op'),
            fieldKey: BuiltValueNullFieldError.checkNotNull(
                fieldKey, r'ApplyFieldCorrectionRequestDto', 'fieldKey'),
            page: page,
            shape: shape,
            x0: x0,
            y0: y0,
            x1: x1,
            y1: y1,
            blockIndexes: _blockIndexes?.build(),
            valueOverride: valueOverride,
            scope: scope,
            tagId: tagId,
            beforeRegionId: beforeRegionId,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'blockIndexes';
        _blockIndexes?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ApplyFieldCorrectionRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
