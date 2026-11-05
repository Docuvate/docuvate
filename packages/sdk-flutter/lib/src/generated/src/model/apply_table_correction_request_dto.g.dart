// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'apply_table_correction_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ApplyTableCorrectionRequestDtoOpEnum
    _$applyTableCorrectionRequestDtoOpEnum_create =
    const ApplyTableCorrectionRequestDtoOpEnum._('create');
const ApplyTableCorrectionRequestDtoOpEnum
    _$applyTableCorrectionRequestDtoOpEnum_setHeaders =
    const ApplyTableCorrectionRequestDtoOpEnum._('setHeaders');
const ApplyTableCorrectionRequestDtoOpEnum
    _$applyTableCorrectionRequestDtoOpEnum_editCell =
    const ApplyTableCorrectionRequestDtoOpEnum._('editCell');
const ApplyTableCorrectionRequestDtoOpEnum
    _$applyTableCorrectionRequestDtoOpEnum_remove =
    const ApplyTableCorrectionRequestDtoOpEnum._('remove');

ApplyTableCorrectionRequestDtoOpEnum
    _$applyTableCorrectionRequestDtoOpEnumValueOf(String name) {
  switch (name) {
    case 'create':
      return _$applyTableCorrectionRequestDtoOpEnum_create;
    case 'setHeaders':
      return _$applyTableCorrectionRequestDtoOpEnum_setHeaders;
    case 'editCell':
      return _$applyTableCorrectionRequestDtoOpEnum_editCell;
    case 'remove':
      return _$applyTableCorrectionRequestDtoOpEnum_remove;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<ApplyTableCorrectionRequestDtoOpEnum>
    _$applyTableCorrectionRequestDtoOpEnumValues = new BuiltSet<
        ApplyTableCorrectionRequestDtoOpEnum>(const <ApplyTableCorrectionRequestDtoOpEnum>[
  _$applyTableCorrectionRequestDtoOpEnum_create,
  _$applyTableCorrectionRequestDtoOpEnum_setHeaders,
  _$applyTableCorrectionRequestDtoOpEnum_editCell,
  _$applyTableCorrectionRequestDtoOpEnum_remove,
]);

const ApplyTableCorrectionRequestDtoShapeEnum
    _$applyTableCorrectionRequestDtoShapeEnum_rect =
    const ApplyTableCorrectionRequestDtoShapeEnum._('rect');
const ApplyTableCorrectionRequestDtoShapeEnum
    _$applyTableCorrectionRequestDtoShapeEnum_polygon =
    const ApplyTableCorrectionRequestDtoShapeEnum._('polygon');

ApplyTableCorrectionRequestDtoShapeEnum
    _$applyTableCorrectionRequestDtoShapeEnumValueOf(String name) {
  switch (name) {
    case 'rect':
      return _$applyTableCorrectionRequestDtoShapeEnum_rect;
    case 'polygon':
      return _$applyTableCorrectionRequestDtoShapeEnum_polygon;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<ApplyTableCorrectionRequestDtoShapeEnum>
    _$applyTableCorrectionRequestDtoShapeEnumValues = new BuiltSet<
        ApplyTableCorrectionRequestDtoShapeEnum>(const <ApplyTableCorrectionRequestDtoShapeEnum>[
  _$applyTableCorrectionRequestDtoShapeEnum_rect,
  _$applyTableCorrectionRequestDtoShapeEnum_polygon,
]);

const ApplyTableCorrectionRequestDtoTableTypeEnum
    _$applyTableCorrectionRequestDtoTableTypeEnum_lineItems =
    const ApplyTableCorrectionRequestDtoTableTypeEnum._('lineItems');
const ApplyTableCorrectionRequestDtoTableTypeEnum
    _$applyTableCorrectionRequestDtoTableTypeEnum_keyValue =
    const ApplyTableCorrectionRequestDtoTableTypeEnum._('keyValue');
const ApplyTableCorrectionRequestDtoTableTypeEnum
    _$applyTableCorrectionRequestDtoTableTypeEnum_other =
    const ApplyTableCorrectionRequestDtoTableTypeEnum._('other');

ApplyTableCorrectionRequestDtoTableTypeEnum
    _$applyTableCorrectionRequestDtoTableTypeEnumValueOf(String name) {
  switch (name) {
    case 'lineItems':
      return _$applyTableCorrectionRequestDtoTableTypeEnum_lineItems;
    case 'keyValue':
      return _$applyTableCorrectionRequestDtoTableTypeEnum_keyValue;
    case 'other':
      return _$applyTableCorrectionRequestDtoTableTypeEnum_other;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<ApplyTableCorrectionRequestDtoTableTypeEnum>
    _$applyTableCorrectionRequestDtoTableTypeEnumValues = new BuiltSet<
        ApplyTableCorrectionRequestDtoTableTypeEnum>(const <ApplyTableCorrectionRequestDtoTableTypeEnum>[
  _$applyTableCorrectionRequestDtoTableTypeEnum_lineItems,
  _$applyTableCorrectionRequestDtoTableTypeEnum_keyValue,
  _$applyTableCorrectionRequestDtoTableTypeEnum_other,
]);

Serializer<ApplyTableCorrectionRequestDtoOpEnum>
    _$applyTableCorrectionRequestDtoOpEnumSerializer =
    new _$ApplyTableCorrectionRequestDtoOpEnumSerializer();
Serializer<ApplyTableCorrectionRequestDtoShapeEnum>
    _$applyTableCorrectionRequestDtoShapeEnumSerializer =
    new _$ApplyTableCorrectionRequestDtoShapeEnumSerializer();
Serializer<ApplyTableCorrectionRequestDtoTableTypeEnum>
    _$applyTableCorrectionRequestDtoTableTypeEnumSerializer =
    new _$ApplyTableCorrectionRequestDtoTableTypeEnumSerializer();

class _$ApplyTableCorrectionRequestDtoOpEnumSerializer
    implements PrimitiveSerializer<ApplyTableCorrectionRequestDtoOpEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'create': 'create',
    'setHeaders': 'set_headers',
    'editCell': 'edit_cell',
    'remove': 'remove',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'create': 'create',
    'set_headers': 'setHeaders',
    'edit_cell': 'editCell',
    'remove': 'remove',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ApplyTableCorrectionRequestDtoOpEnum
  ];
  @override
  final String wireName = 'ApplyTableCorrectionRequestDtoOpEnum';

  @override
  Object serialize(
          Serializers serializers, ApplyTableCorrectionRequestDtoOpEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ApplyTableCorrectionRequestDtoOpEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ApplyTableCorrectionRequestDtoOpEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ApplyTableCorrectionRequestDtoShapeEnumSerializer
    implements PrimitiveSerializer<ApplyTableCorrectionRequestDtoShapeEnum> {
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
    ApplyTableCorrectionRequestDtoShapeEnum
  ];
  @override
  final String wireName = 'ApplyTableCorrectionRequestDtoShapeEnum';

  @override
  Object serialize(Serializers serializers,
          ApplyTableCorrectionRequestDtoShapeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ApplyTableCorrectionRequestDtoShapeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ApplyTableCorrectionRequestDtoShapeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ApplyTableCorrectionRequestDtoTableTypeEnumSerializer
    implements
        PrimitiveSerializer<ApplyTableCorrectionRequestDtoTableTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'lineItems': 'line_items',
    'keyValue': 'key_value',
    'other': 'other',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'line_items': 'lineItems',
    'key_value': 'keyValue',
    'other': 'other',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ApplyTableCorrectionRequestDtoTableTypeEnum
  ];
  @override
  final String wireName = 'ApplyTableCorrectionRequestDtoTableTypeEnum';

  @override
  Object serialize(Serializers serializers,
          ApplyTableCorrectionRequestDtoTableTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ApplyTableCorrectionRequestDtoTableTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ApplyTableCorrectionRequestDtoTableTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ApplyTableCorrectionRequestDto extends ApplyTableCorrectionRequestDto {
  @override
  final String id;
  @override
  final ApplyTableCorrectionRequestDtoOpEnum op;
  @override
  final num? page;
  @override
  final ApplyTableCorrectionRequestDtoShapeEnum? shape;
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
  final String? beforeRegionId;
  @override
  final ApplyTableCorrectionRequestDtoTableTypeEnum? tableType;
  @override
  final num? headerRows;
  @override
  final num? headerCols;
  @override
  final DocumentRegionTableCellDto? cell;

  factory _$ApplyTableCorrectionRequestDto(
          [void Function(ApplyTableCorrectionRequestDtoBuilder)? updates]) =>
      (new ApplyTableCorrectionRequestDtoBuilder()..update(updates))._build();

  _$ApplyTableCorrectionRequestDto._(
      {required this.id,
      required this.op,
      this.page,
      this.shape,
      this.x0,
      this.y0,
      this.x1,
      this.y1,
      this.blockIndexes,
      this.beforeRegionId,
      this.tableType,
      this.headerRows,
      this.headerCols,
      this.cell})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        id, r'ApplyTableCorrectionRequestDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        op, r'ApplyTableCorrectionRequestDto', 'op');
  }

  @override
  ApplyTableCorrectionRequestDto rebuild(
          void Function(ApplyTableCorrectionRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ApplyTableCorrectionRequestDtoBuilder toBuilder() =>
      new ApplyTableCorrectionRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ApplyTableCorrectionRequestDto &&
        id == other.id &&
        op == other.op &&
        page == other.page &&
        shape == other.shape &&
        x0 == other.x0 &&
        y0 == other.y0 &&
        x1 == other.x1 &&
        y1 == other.y1 &&
        blockIndexes == other.blockIndexes &&
        beforeRegionId == other.beforeRegionId &&
        tableType == other.tableType &&
        headerRows == other.headerRows &&
        headerCols == other.headerCols &&
        cell == other.cell;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, op.hashCode);
    _$hash = $jc(_$hash, page.hashCode);
    _$hash = $jc(_$hash, shape.hashCode);
    _$hash = $jc(_$hash, x0.hashCode);
    _$hash = $jc(_$hash, y0.hashCode);
    _$hash = $jc(_$hash, x1.hashCode);
    _$hash = $jc(_$hash, y1.hashCode);
    _$hash = $jc(_$hash, blockIndexes.hashCode);
    _$hash = $jc(_$hash, beforeRegionId.hashCode);
    _$hash = $jc(_$hash, tableType.hashCode);
    _$hash = $jc(_$hash, headerRows.hashCode);
    _$hash = $jc(_$hash, headerCols.hashCode);
    _$hash = $jc(_$hash, cell.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ApplyTableCorrectionRequestDto')
          ..add('id', id)
          ..add('op', op)
          ..add('page', page)
          ..add('shape', shape)
          ..add('x0', x0)
          ..add('y0', y0)
          ..add('x1', x1)
          ..add('y1', y1)
          ..add('blockIndexes', blockIndexes)
          ..add('beforeRegionId', beforeRegionId)
          ..add('tableType', tableType)
          ..add('headerRows', headerRows)
          ..add('headerCols', headerCols)
          ..add('cell', cell))
        .toString();
  }
}

class ApplyTableCorrectionRequestDtoBuilder
    implements
        Builder<ApplyTableCorrectionRequestDto,
            ApplyTableCorrectionRequestDtoBuilder> {
  _$ApplyTableCorrectionRequestDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  ApplyTableCorrectionRequestDtoOpEnum? _op;
  ApplyTableCorrectionRequestDtoOpEnum? get op => _$this._op;
  set op(ApplyTableCorrectionRequestDtoOpEnum? op) => _$this._op = op;

  num? _page;
  num? get page => _$this._page;
  set page(num? page) => _$this._page = page;

  ApplyTableCorrectionRequestDtoShapeEnum? _shape;
  ApplyTableCorrectionRequestDtoShapeEnum? get shape => _$this._shape;
  set shape(ApplyTableCorrectionRequestDtoShapeEnum? shape) =>
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
      _$this._blockIndexes ??= new ListBuilder<num>();
  set blockIndexes(ListBuilder<num>? blockIndexes) =>
      _$this._blockIndexes = blockIndexes;

  String? _beforeRegionId;
  String? get beforeRegionId => _$this._beforeRegionId;
  set beforeRegionId(String? beforeRegionId) =>
      _$this._beforeRegionId = beforeRegionId;

  ApplyTableCorrectionRequestDtoTableTypeEnum? _tableType;
  ApplyTableCorrectionRequestDtoTableTypeEnum? get tableType =>
      _$this._tableType;
  set tableType(ApplyTableCorrectionRequestDtoTableTypeEnum? tableType) =>
      _$this._tableType = tableType;

  num? _headerRows;
  num? get headerRows => _$this._headerRows;
  set headerRows(num? headerRows) => _$this._headerRows = headerRows;

  num? _headerCols;
  num? get headerCols => _$this._headerCols;
  set headerCols(num? headerCols) => _$this._headerCols = headerCols;

  DocumentRegionTableCellDtoBuilder? _cell;
  DocumentRegionTableCellDtoBuilder get cell =>
      _$this._cell ??= new DocumentRegionTableCellDtoBuilder();
  set cell(DocumentRegionTableCellDtoBuilder? cell) => _$this._cell = cell;

  ApplyTableCorrectionRequestDtoBuilder() {
    ApplyTableCorrectionRequestDto._defaults(this);
  }

  ApplyTableCorrectionRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _op = $v.op;
      _page = $v.page;
      _shape = $v.shape;
      _x0 = $v.x0;
      _y0 = $v.y0;
      _x1 = $v.x1;
      _y1 = $v.y1;
      _blockIndexes = $v.blockIndexes?.toBuilder();
      _beforeRegionId = $v.beforeRegionId;
      _tableType = $v.tableType;
      _headerRows = $v.headerRows;
      _headerCols = $v.headerCols;
      _cell = $v.cell?.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ApplyTableCorrectionRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ApplyTableCorrectionRequestDto;
  }

  @override
  void update(void Function(ApplyTableCorrectionRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ApplyTableCorrectionRequestDto build() => _build();

  _$ApplyTableCorrectionRequestDto _build() {
    _$ApplyTableCorrectionRequestDto _$result;
    try {
      _$result = _$v ??
          new _$ApplyTableCorrectionRequestDto._(
              id: BuiltValueNullFieldError.checkNotNull(
                  id, r'ApplyTableCorrectionRequestDto', 'id'),
              op: BuiltValueNullFieldError.checkNotNull(
                  op, r'ApplyTableCorrectionRequestDto', 'op'),
              page: page,
              shape: shape,
              x0: x0,
              y0: y0,
              x1: x1,
              y1: y1,
              blockIndexes: _blockIndexes?.build(),
              beforeRegionId: beforeRegionId,
              tableType: tableType,
              headerRows: headerRows,
              headerCols: headerCols,
              cell: _cell?.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'blockIndexes';
        _blockIndexes?.build();

        _$failedField = 'cell';
        _cell?.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'ApplyTableCorrectionRequestDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
