// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_region_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DocumentRegionDtoShapeEnum _$documentRegionDtoShapeEnum_rect =
    const DocumentRegionDtoShapeEnum._('rect');
const DocumentRegionDtoShapeEnum _$documentRegionDtoShapeEnum_polygon =
    const DocumentRegionDtoShapeEnum._('polygon');

DocumentRegionDtoShapeEnum _$documentRegionDtoShapeEnumValueOf(String name) {
  switch (name) {
    case 'rect':
      return _$documentRegionDtoShapeEnum_rect;
    case 'polygon':
      return _$documentRegionDtoShapeEnum_polygon;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<DocumentRegionDtoShapeEnum> _$documentRegionDtoShapeEnumValues =
    new BuiltSet<DocumentRegionDtoShapeEnum>(const <DocumentRegionDtoShapeEnum>[
  _$documentRegionDtoShapeEnum_rect,
  _$documentRegionDtoShapeEnum_polygon,
]);

const DocumentRegionDtoRoleEnum _$documentRegionDtoRoleEnum_field =
    const DocumentRegionDtoRoleEnum._('field');
const DocumentRegionDtoRoleEnum _$documentRegionDtoRoleEnum_table =
    const DocumentRegionDtoRoleEnum._('table');
const DocumentRegionDtoRoleEnum _$documentRegionDtoRoleEnum_block =
    const DocumentRegionDtoRoleEnum._('block');
const DocumentRegionDtoRoleEnum _$documentRegionDtoRoleEnum_ignore =
    const DocumentRegionDtoRoleEnum._('ignore');

DocumentRegionDtoRoleEnum _$documentRegionDtoRoleEnumValueOf(String name) {
  switch (name) {
    case 'field':
      return _$documentRegionDtoRoleEnum_field;
    case 'table':
      return _$documentRegionDtoRoleEnum_table;
    case 'block':
      return _$documentRegionDtoRoleEnum_block;
    case 'ignore':
      return _$documentRegionDtoRoleEnum_ignore;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<DocumentRegionDtoRoleEnum> _$documentRegionDtoRoleEnumValues =
    new BuiltSet<DocumentRegionDtoRoleEnum>(const <DocumentRegionDtoRoleEnum>[
  _$documentRegionDtoRoleEnum_field,
  _$documentRegionDtoRoleEnum_table,
  _$documentRegionDtoRoleEnum_block,
  _$documentRegionDtoRoleEnum_ignore,
]);

Serializer<DocumentRegionDtoShapeEnum> _$documentRegionDtoShapeEnumSerializer =
    new _$DocumentRegionDtoShapeEnumSerializer();
Serializer<DocumentRegionDtoRoleEnum> _$documentRegionDtoRoleEnumSerializer =
    new _$DocumentRegionDtoRoleEnumSerializer();

class _$DocumentRegionDtoShapeEnumSerializer
    implements PrimitiveSerializer<DocumentRegionDtoShapeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'rect': 'rect',
    'polygon': 'polygon',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'rect': 'rect',
    'polygon': 'polygon',
  };

  @override
  final Iterable<Type> types = const <Type>[DocumentRegionDtoShapeEnum];
  @override
  final String wireName = 'DocumentRegionDtoShapeEnum';

  @override
  Object serialize(Serializers serializers, DocumentRegionDtoShapeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentRegionDtoShapeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentRegionDtoShapeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentRegionDtoRoleEnumSerializer
    implements PrimitiveSerializer<DocumentRegionDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'field': 'field',
    'table': 'table',
    'block': 'block',
    'ignore': 'ignore',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'field': 'field',
    'table': 'table',
    'block': 'block',
    'ignore': 'ignore',
  };

  @override
  final Iterable<Type> types = const <Type>[DocumentRegionDtoRoleEnum];
  @override
  final String wireName = 'DocumentRegionDtoRoleEnum';

  @override
  Object serialize(Serializers serializers, DocumentRegionDtoRoleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentRegionDtoRoleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentRegionDtoRoleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentRegionDto extends DocumentRegionDto {
  @override
  final String id;
  @override
  final String documentId;
  @override
  final num page;
  @override
  final DocumentRegionDtoShapeEnum shape;
  @override
  final DocumentRegionDtoRoleEnum role;
  @override
  final num x0;
  @override
  final num y0;
  @override
  final num x1;
  @override
  final num y1;
  @override
  final String irSha256;
  @override
  final bool needsReview;
  @override
  final BuiltList<num> blockIndexes;
  @override
  final DocumentRegionFieldDto? field;
  @override
  final DocumentRegionTableDto? table;
  @override
  final String createdAt;

  factory _$DocumentRegionDto(
          [void Function(DocumentRegionDtoBuilder)? updates]) =>
      (new DocumentRegionDtoBuilder()..update(updates))._build();

  _$DocumentRegionDto._(
      {required this.id,
      required this.documentId,
      required this.page,
      required this.shape,
      required this.role,
      required this.x0,
      required this.y0,
      required this.x1,
      required this.y1,
      required this.irSha256,
      required this.needsReview,
      required this.blockIndexes,
      this.field,
      this.table,
      required this.createdAt})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(id, r'DocumentRegionDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        documentId, r'DocumentRegionDto', 'documentId');
    BuiltValueNullFieldError.checkNotNull(page, r'DocumentRegionDto', 'page');
    BuiltValueNullFieldError.checkNotNull(shape, r'DocumentRegionDto', 'shape');
    BuiltValueNullFieldError.checkNotNull(role, r'DocumentRegionDto', 'role');
    BuiltValueNullFieldError.checkNotNull(x0, r'DocumentRegionDto', 'x0');
    BuiltValueNullFieldError.checkNotNull(y0, r'DocumentRegionDto', 'y0');
    BuiltValueNullFieldError.checkNotNull(x1, r'DocumentRegionDto', 'x1');
    BuiltValueNullFieldError.checkNotNull(y1, r'DocumentRegionDto', 'y1');
    BuiltValueNullFieldError.checkNotNull(
        irSha256, r'DocumentRegionDto', 'irSha256');
    BuiltValueNullFieldError.checkNotNull(
        needsReview, r'DocumentRegionDto', 'needsReview');
    BuiltValueNullFieldError.checkNotNull(
        blockIndexes, r'DocumentRegionDto', 'blockIndexes');
    BuiltValueNullFieldError.checkNotNull(
        createdAt, r'DocumentRegionDto', 'createdAt');
  }

  @override
  DocumentRegionDto rebuild(void Function(DocumentRegionDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentRegionDtoBuilder toBuilder() =>
      new DocumentRegionDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentRegionDto &&
        id == other.id &&
        documentId == other.documentId &&
        page == other.page &&
        shape == other.shape &&
        role == other.role &&
        x0 == other.x0 &&
        y0 == other.y0 &&
        x1 == other.x1 &&
        y1 == other.y1 &&
        irSha256 == other.irSha256 &&
        needsReview == other.needsReview &&
        blockIndexes == other.blockIndexes &&
        field == other.field &&
        table == other.table &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, documentId.hashCode);
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, shape.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jc(_$hash, x0.hashCode);
    _$hash = $jc(_$hash, y0.hashCode);
    _$hash = $jc(_$hash, x1.hashCode);
    _$hash = $jc(_$hash, y1.hashCode);
    _$hash = $jc(_$hash, irSha256.hashCode);
    _$hash = $jc(_$hash, needsReview.hashCode);
    _$hash = $jc(_$hash, blockIndexes.hashCode);
    _$hash = $jc(_$hash, field.hashCode);
    _$hash = $jc(_$hash, table.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentRegionDto')
          ..add('id', id)
          ..add('documentId', documentId)
          ..add('page', page)
          ..add('shape', shape)
          ..add('role', role)
          ..add('x0', x0)
          ..add('y0', y0)
          ..add('x1', x1)
          ..add('y1', y1)
          ..add('irSha256', irSha256)
          ..add('needsReview', needsReview)
          ..add('blockIndexes', blockIndexes)
          ..add('field', field)
          ..add('table', table)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class DocumentRegionDtoBuilder
    implements Builder<DocumentRegionDto, DocumentRegionDtoBuilder> {
  _$DocumentRegionDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _documentId;
  String? get documentId => _$this._documentId;
  set documentId(String? documentId) => _$this._documentId = documentId;

  num? _page;
  num? get page => _$this._page;
  set page(num? page) => _$this._page = page;

  DocumentRegionDtoShapeEnum? _shape;
  DocumentRegionDtoShapeEnum? get shape => _$this._shape;
  set shape(DocumentRegionDtoShapeEnum? shape) => _$this._shape = shape;

  DocumentRegionDtoRoleEnum? _role;
  DocumentRegionDtoRoleEnum? get role => _$this._role;
  set role(DocumentRegionDtoRoleEnum? role) => _$this._role = role;

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

  String? _irSha256;
  String? get irSha256 => _$this._irSha256;
  set irSha256(String? irSha256) => _$this._irSha256 = irSha256;

  bool? _needsReview;
  bool? get needsReview => _$this._needsReview;
  set needsReview(bool? needsReview) => _$this._needsReview = needsReview;

  ListBuilder<num>? _blockIndexes;
  ListBuilder<num> get blockIndexes =>
      _$this._blockIndexes ??= new ListBuilder<num>();
  set blockIndexes(ListBuilder<num>? blockIndexes) =>
      _$this._blockIndexes = blockIndexes;

  DocumentRegionFieldDtoBuilder? _field;
  DocumentRegionFieldDtoBuilder get field =>
      _$this._field ??= new DocumentRegionFieldDtoBuilder();
  set field(DocumentRegionFieldDtoBuilder? field) => _$this._field = field;

  DocumentRegionTableDtoBuilder? _table;
  DocumentRegionTableDtoBuilder get table =>
      _$this._table ??= new DocumentRegionTableDtoBuilder();
  set table(DocumentRegionTableDtoBuilder? table) => _$this._table = table;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  DocumentRegionDtoBuilder() {
    DocumentRegionDto._defaults(this);
  }

  DocumentRegionDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _documentId = $v.documentId;
      _page = $v.page;
      _shape = $v.shape;
      _role = $v.role;
      _x0 = $v.x0;
      _y0 = $v.y0;
      _x1 = $v.x1;
      _y1 = $v.y1;
      _irSha256 = $v.irSha256;
      _needsReview = $v.needsReview;
      _blockIndexes = $v.blockIndexes.toBuilder();
      _field = $v.field?.toBuilder();
      _table = $v.table?.toBuilder();
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentRegionDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentRegionDto;
  }

  @override
  void update(void Function(DocumentRegionDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentRegionDto build() => _build();

  _$DocumentRegionDto _build() {
    _$DocumentRegionDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentRegionDto._(
              id: BuiltValueNullFieldError.checkNotNull(
                  id, r'DocumentRegionDto', 'id'),
              documentId: BuiltValueNullFieldError.checkNotNull(
                  documentId, r'DocumentRegionDto', 'documentId'),
              page: BuiltValueNullFieldError.checkNotNull(
                  page, r'DocumentRegionDto', 'page'),
              shape: BuiltValueNullFieldError.checkNotNull(
                  shape, r'DocumentRegionDto', 'shape'),
              role: BuiltValueNullFieldError.checkNotNull(
                  role, r'DocumentRegionDto', 'role'),
              x0: BuiltValueNullFieldError.checkNotNull(
                  x0, r'DocumentRegionDto', 'x0'),
              y0: BuiltValueNullFieldError.checkNotNull(
                  y0, r'DocumentRegionDto', 'y0'),
              x1: BuiltValueNullFieldError.checkNotNull(
                  x1, r'DocumentRegionDto', 'x1'),
              y1: BuiltValueNullFieldError.checkNotNull(
                  y1, r'DocumentRegionDto', 'y1'),
              irSha256: BuiltValueNullFieldError.checkNotNull(irSha256, r'DocumentRegionDto', 'irSha256'),
              needsReview: BuiltValueNullFieldError.checkNotNull(needsReview, r'DocumentRegionDto', 'needsReview'),
              blockIndexes: blockIndexes.build(),
              field: _field?.build(),
              table: _table?.build(),
              createdAt: BuiltValueNullFieldError.checkNotNull(createdAt, r'DocumentRegionDto', 'createdAt'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'blockIndexes';
        blockIndexes.build();
        _$failedField = 'field';
        _field?.build();
        _$failedField = 'table';
        _table?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentRegionDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
