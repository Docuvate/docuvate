// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'table_rule_line_input_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const TableRuleLineInputDtoAxisEnum _$tableRuleLineInputDtoAxisEnum_row =
    const TableRuleLineInputDtoAxisEnum._('row');
const TableRuleLineInputDtoAxisEnum _$tableRuleLineInputDtoAxisEnum_col =
    const TableRuleLineInputDtoAxisEnum._('col');

TableRuleLineInputDtoAxisEnum _$tableRuleLineInputDtoAxisEnumValueOf(
    String name) {
  switch (name) {
    case 'row':
      return _$tableRuleLineInputDtoAxisEnum_row;
    case 'col':
      return _$tableRuleLineInputDtoAxisEnum_col;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<TableRuleLineInputDtoAxisEnum>
    _$tableRuleLineInputDtoAxisEnumValues = BuiltSet<
        TableRuleLineInputDtoAxisEnum>(const <TableRuleLineInputDtoAxisEnum>[
  _$tableRuleLineInputDtoAxisEnum_row,
  _$tableRuleLineInputDtoAxisEnum_col,
]);

const TableRuleLineInputDtoLineEnum _$tableRuleLineInputDtoLineEnum_unknown =
    const TableRuleLineInputDtoLineEnum._('unknown');
const TableRuleLineInputDtoLineEnum _$tableRuleLineInputDtoLineEnum_none =
    const TableRuleLineInputDtoLineEnum._('none');
const TableRuleLineInputDtoLineEnum _$tableRuleLineInputDtoLineEnum_thin =
    const TableRuleLineInputDtoLineEnum._('thin');
const TableRuleLineInputDtoLineEnum _$tableRuleLineInputDtoLineEnum_thick =
    const TableRuleLineInputDtoLineEnum._('thick');
const TableRuleLineInputDtoLineEnum _$tableRuleLineInputDtoLineEnum_double_ =
    const TableRuleLineInputDtoLineEnum._('double_');

TableRuleLineInputDtoLineEnum _$tableRuleLineInputDtoLineEnumValueOf(
    String name) {
  switch (name) {
    case 'unknown':
      return _$tableRuleLineInputDtoLineEnum_unknown;
    case 'none':
      return _$tableRuleLineInputDtoLineEnum_none;
    case 'thin':
      return _$tableRuleLineInputDtoLineEnum_thin;
    case 'thick':
      return _$tableRuleLineInputDtoLineEnum_thick;
    case 'double_':
      return _$tableRuleLineInputDtoLineEnum_double_;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<TableRuleLineInputDtoLineEnum>
    _$tableRuleLineInputDtoLineEnumValues = BuiltSet<
        TableRuleLineInputDtoLineEnum>(const <TableRuleLineInputDtoLineEnum>[
  _$tableRuleLineInputDtoLineEnum_unknown,
  _$tableRuleLineInputDtoLineEnum_none,
  _$tableRuleLineInputDtoLineEnum_thin,
  _$tableRuleLineInputDtoLineEnum_thick,
  _$tableRuleLineInputDtoLineEnum_double_,
]);

Serializer<TableRuleLineInputDtoAxisEnum>
    _$tableRuleLineInputDtoAxisEnumSerializer =
    _$TableRuleLineInputDtoAxisEnumSerializer();
Serializer<TableRuleLineInputDtoLineEnum>
    _$tableRuleLineInputDtoLineEnumSerializer =
    _$TableRuleLineInputDtoLineEnumSerializer();

class _$TableRuleLineInputDtoAxisEnumSerializer
    implements PrimitiveSerializer<TableRuleLineInputDtoAxisEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'row': 'row',
    'col': 'col',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'row': 'row',
    'col': 'col',
  };

  @override
  final Iterable<Type> types = const <Type>[TableRuleLineInputDtoAxisEnum];
  @override
  final String wireName = 'TableRuleLineInputDtoAxisEnum';

  @override
  Object serialize(
          Serializers serializers, TableRuleLineInputDtoAxisEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  TableRuleLineInputDtoAxisEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      TableRuleLineInputDtoAxisEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$TableRuleLineInputDtoLineEnumSerializer
    implements PrimitiveSerializer<TableRuleLineInputDtoLineEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'unknown': 'unknown',
    'none': 'none',
    'thin': 'thin',
    'thick': 'thick',
    'double_': 'double',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'unknown': 'unknown',
    'none': 'none',
    'thin': 'thin',
    'thick': 'thick',
    'double': 'double_',
  };

  @override
  final Iterable<Type> types = const <Type>[TableRuleLineInputDtoLineEnum];
  @override
  final String wireName = 'TableRuleLineInputDtoLineEnum';

  @override
  Object serialize(
          Serializers serializers, TableRuleLineInputDtoLineEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  TableRuleLineInputDtoLineEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      TableRuleLineInputDtoLineEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$TableRuleLineInputDto extends TableRuleLineInputDto {
  @override
  final TableRuleLineInputDtoAxisEnum axis;
  @override
  final num ord;
  @override
  final TableRuleLineInputDtoLineEnum line;

  factory _$TableRuleLineInputDto(
          [void Function(TableRuleLineInputDtoBuilder)? updates]) =>
      (TableRuleLineInputDtoBuilder()..update(updates))._build();

  _$TableRuleLineInputDto._(
      {required this.axis, required this.ord, required this.line})
      : super._();
  @override
  TableRuleLineInputDto rebuild(
          void Function(TableRuleLineInputDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TableRuleLineInputDtoBuilder toBuilder() =>
      TableRuleLineInputDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TableRuleLineInputDto &&
        axis == other.axis &&
        ord == other.ord &&
        line == other.line;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, axis.hashCode);
    _$hash = $jc(_$hash, ord.hashCode);
    _$hash = $jc(_$hash, line.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TableRuleLineInputDto')
          ..add('axis', axis)
          ..add('ord', ord)
          ..add('line', line))
        .toString();
  }
}

class TableRuleLineInputDtoBuilder
    implements Builder<TableRuleLineInputDto, TableRuleLineInputDtoBuilder> {
  _$TableRuleLineInputDto? _$v;

  TableRuleLineInputDtoAxisEnum? _axis;
  TableRuleLineInputDtoAxisEnum? get axis => _$this._axis;
  set axis(TableRuleLineInputDtoAxisEnum? axis) => _$this._axis = axis;

  num? _ord;
  num? get ord => _$this._ord;
  set ord(num? ord) => _$this._ord = ord;

  TableRuleLineInputDtoLineEnum? _line;
  TableRuleLineInputDtoLineEnum? get line => _$this._line;
  set line(TableRuleLineInputDtoLineEnum? line) => _$this._line = line;

  TableRuleLineInputDtoBuilder() {
    TableRuleLineInputDto._defaults(this);
  }

  TableRuleLineInputDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _axis = $v.axis;
      _ord = $v.ord;
      _line = $v.line;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TableRuleLineInputDto other) {
    _$v = other as _$TableRuleLineInputDto;
  }

  @override
  void update(void Function(TableRuleLineInputDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TableRuleLineInputDto build() => _build();

  _$TableRuleLineInputDto _build() {
    final _$result = _$v ??
        _$TableRuleLineInputDto._(
          axis: BuiltValueNullFieldError.checkNotNull(
              axis, r'TableRuleLineInputDto', 'axis'),
          ord: BuiltValueNullFieldError.checkNotNull(
              ord, r'TableRuleLineInputDto', 'ord'),
          line: BuiltValueNullFieldError.checkNotNull(
              line, r'TableRuleLineInputDto', 'line'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
