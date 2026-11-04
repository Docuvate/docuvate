// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_region_table_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const DocumentRegionTableDtoTableTypeEnum
    _$documentRegionTableDtoTableTypeEnum_lineItems =
    const DocumentRegionTableDtoTableTypeEnum._('lineItems');
const DocumentRegionTableDtoTableTypeEnum
    _$documentRegionTableDtoTableTypeEnum_keyValue =
    const DocumentRegionTableDtoTableTypeEnum._('keyValue');
const DocumentRegionTableDtoTableTypeEnum
    _$documentRegionTableDtoTableTypeEnum_other =
    const DocumentRegionTableDtoTableTypeEnum._('other');

DocumentRegionTableDtoTableTypeEnum
    _$documentRegionTableDtoTableTypeEnumValueOf(String name) {
  switch (name) {
    case 'lineItems':
      return _$documentRegionTableDtoTableTypeEnum_lineItems;
    case 'keyValue':
      return _$documentRegionTableDtoTableTypeEnum_keyValue;
    case 'other':
      return _$documentRegionTableDtoTableTypeEnum_other;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<DocumentRegionTableDtoTableTypeEnum>
    _$documentRegionTableDtoTableTypeEnumValues = new BuiltSet<
        DocumentRegionTableDtoTableTypeEnum>(const <DocumentRegionTableDtoTableTypeEnum>[
  _$documentRegionTableDtoTableTypeEnum_lineItems,
  _$documentRegionTableDtoTableTypeEnum_keyValue,
  _$documentRegionTableDtoTableTypeEnum_other,
]);

Serializer<DocumentRegionTableDtoTableTypeEnum>
    _$documentRegionTableDtoTableTypeEnumSerializer =
    new _$DocumentRegionTableDtoTableTypeEnumSerializer();

class _$DocumentRegionTableDtoTableTypeEnumSerializer
    implements PrimitiveSerializer<DocumentRegionTableDtoTableTypeEnum> {
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
    DocumentRegionTableDtoTableTypeEnum
  ];
  @override
  final String wireName = 'DocumentRegionTableDtoTableTypeEnum';

  @override
  Object serialize(
          Serializers serializers, DocumentRegionTableDtoTableTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  DocumentRegionTableDtoTableTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      DocumentRegionTableDtoTableTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$DocumentRegionTableDto extends DocumentRegionTableDto {
  @override
  final DocumentRegionTableDtoTableTypeEnum tableType;
  @override
  final num headerRows;
  @override
  final num headerCols;
  @override
  final BuiltList<DocumentRegionTableRuleDto> rules;
  @override
  final BuiltList<DocumentRegionTableMergeDto> merges;
  @override
  final BuiltList<DocumentRegionTableCellDto> cells;

  factory _$DocumentRegionTableDto(
          [void Function(DocumentRegionTableDtoBuilder)? updates]) =>
      (new DocumentRegionTableDtoBuilder()..update(updates))._build();

  _$DocumentRegionTableDto._(
      {required this.tableType,
      required this.headerRows,
      required this.headerCols,
      required this.rules,
      required this.merges,
      required this.cells})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        tableType, r'DocumentRegionTableDto', 'tableType');
    BuiltValueNullFieldError.checkNotNull(
        headerRows, r'DocumentRegionTableDto', 'headerRows');
    BuiltValueNullFieldError.checkNotNull(
        headerCols, r'DocumentRegionTableDto', 'headerCols');
    BuiltValueNullFieldError.checkNotNull(
        rules, r'DocumentRegionTableDto', 'rules');
    BuiltValueNullFieldError.checkNotNull(
        merges, r'DocumentRegionTableDto', 'merges');
    BuiltValueNullFieldError.checkNotNull(
        cells, r'DocumentRegionTableDto', 'cells');
  }

  @override
  DocumentRegionTableDto rebuild(
          void Function(DocumentRegionTableDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentRegionTableDtoBuilder toBuilder() =>
      new DocumentRegionTableDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentRegionTableDto &&
        tableType == other.tableType &&
        headerRows == other.headerRows &&
        headerCols == other.headerCols &&
        rules == other.rules &&
        merges == other.merges &&
        cells == other.cells;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, tableType.hashCode);
    _$hash = $jc(_$hash, headerRows.hashCode);
    _$hash = $jc(_$hash, headerCols.hashCode);
    _$hash = $jc(_$hash, rules.hashCode);
    _$hash = $jc(_$hash, merges.hashCode);
    _$hash = $jc(_$hash, cells.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentRegionTableDto')
          ..add('tableType', tableType)
          ..add('headerRows', headerRows)
          ..add('headerCols', headerCols)
          ..add('rules', rules)
          ..add('merges', merges)
          ..add('cells', cells))
        .toString();
  }
}

class DocumentRegionTableDtoBuilder
    implements Builder<DocumentRegionTableDto, DocumentRegionTableDtoBuilder> {
  _$DocumentRegionTableDto? _$v;

  DocumentRegionTableDtoTableTypeEnum? _tableType;
  DocumentRegionTableDtoTableTypeEnum? get tableType => _$this._tableType;
  set tableType(DocumentRegionTableDtoTableTypeEnum? tableType) =>
      _$this._tableType = tableType;

  num? _headerRows;
  num? get headerRows => _$this._headerRows;
  set headerRows(num? headerRows) => _$this._headerRows = headerRows;

  num? _headerCols;
  num? get headerCols => _$this._headerCols;
  set headerCols(num? headerCols) => _$this._headerCols = headerCols;

  ListBuilder<DocumentRegionTableRuleDto>? _rules;
  ListBuilder<DocumentRegionTableRuleDto> get rules =>
      _$this._rules ??= new ListBuilder<DocumentRegionTableRuleDto>();
  set rules(ListBuilder<DocumentRegionTableRuleDto>? rules) =>
      _$this._rules = rules;

  ListBuilder<DocumentRegionTableMergeDto>? _merges;
  ListBuilder<DocumentRegionTableMergeDto> get merges =>
      _$this._merges ??= new ListBuilder<DocumentRegionTableMergeDto>();
  set merges(ListBuilder<DocumentRegionTableMergeDto>? merges) =>
      _$this._merges = merges;

  ListBuilder<DocumentRegionTableCellDto>? _cells;
  ListBuilder<DocumentRegionTableCellDto> get cells =>
      _$this._cells ??= new ListBuilder<DocumentRegionTableCellDto>();
  set cells(ListBuilder<DocumentRegionTableCellDto>? cells) =>
      _$this._cells = cells;

  DocumentRegionTableDtoBuilder() {
    DocumentRegionTableDto._defaults(this);
  }

  DocumentRegionTableDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _tableType = $v.tableType;
      _headerRows = $v.headerRows;
      _headerCols = $v.headerCols;
      _rules = $v.rules.toBuilder();
      _merges = $v.merges.toBuilder();
      _cells = $v.cells.toBuilder();
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentRegionTableDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentRegionTableDto;
  }

  @override
  void update(void Function(DocumentRegionTableDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentRegionTableDto build() => _build();

  _$DocumentRegionTableDto _build() {
    _$DocumentRegionTableDto _$result;
    try {
      _$result = _$v ??
          new _$DocumentRegionTableDto._(
              tableType: BuiltValueNullFieldError.checkNotNull(
                  tableType, r'DocumentRegionTableDto', 'tableType'),
              headerRows: BuiltValueNullFieldError.checkNotNull(
                  headerRows, r'DocumentRegionTableDto', 'headerRows'),
              headerCols: BuiltValueNullFieldError.checkNotNull(
                  headerCols, r'DocumentRegionTableDto', 'headerCols'),
              rules: rules.build(),
              merges: merges.build(),
              cells: cells.build());
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'rules';
        rules.build();
        _$failedField = 'merges';
        merges.build();
        _$failedField = 'cells';
        cells.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'DocumentRegionTableDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
