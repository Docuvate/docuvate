// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'table_row_role_input_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const TableRowRoleInputDtoRoleEnum _$tableRowRoleInputDtoRoleEnum_section =
    const TableRowRoleInputDtoRoleEnum._('section');
const TableRowRoleInputDtoRoleEnum _$tableRowRoleInputDtoRoleEnum_subtotal =
    const TableRowRoleInputDtoRoleEnum._('subtotal');

TableRowRoleInputDtoRoleEnum _$tableRowRoleInputDtoRoleEnumValueOf(
    String name) {
  switch (name) {
    case 'section':
      return _$tableRowRoleInputDtoRoleEnum_section;
    case 'subtotal':
      return _$tableRowRoleInputDtoRoleEnum_subtotal;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<TableRowRoleInputDtoRoleEnum>
    _$tableRowRoleInputDtoRoleEnumValues =
    BuiltSet<TableRowRoleInputDtoRoleEnum>(const <TableRowRoleInputDtoRoleEnum>[
  _$tableRowRoleInputDtoRoleEnum_section,
  _$tableRowRoleInputDtoRoleEnum_subtotal,
]);

Serializer<TableRowRoleInputDtoRoleEnum>
    _$tableRowRoleInputDtoRoleEnumSerializer =
    _$TableRowRoleInputDtoRoleEnumSerializer();

class _$TableRowRoleInputDtoRoleEnumSerializer
    implements PrimitiveSerializer<TableRowRoleInputDtoRoleEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'section': 'section',
    'subtotal': 'subtotal',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'section': 'section',
    'subtotal': 'subtotal',
  };

  @override
  final Iterable<Type> types = const <Type>[TableRowRoleInputDtoRoleEnum];
  @override
  final String wireName = 'TableRowRoleInputDtoRoleEnum';

  @override
  Object serialize(Serializers serializers, TableRowRoleInputDtoRoleEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  TableRowRoleInputDtoRoleEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      TableRowRoleInputDtoRoleEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$TableRowRoleInputDto extends TableRowRoleInputDto {
  @override
  final num row;
  @override
  final TableRowRoleInputDtoRoleEnum role;

  factory _$TableRowRoleInputDto(
          [void Function(TableRowRoleInputDtoBuilder)? updates]) =>
      (TableRowRoleInputDtoBuilder()..update(updates))._build();

  _$TableRowRoleInputDto._({required this.row, required this.role}) : super._();
  @override
  TableRowRoleInputDto rebuild(
          void Function(TableRowRoleInputDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  TableRowRoleInputDtoBuilder toBuilder() =>
      TableRowRoleInputDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is TableRowRoleInputDto &&
        row == other.row &&
        role == other.role;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, row.hashCode);
    _$hash = $jc(_$hash, role.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'TableRowRoleInputDto')
          ..add('row', row)
          ..add('role', role))
        .toString();
  }
}

class TableRowRoleInputDtoBuilder
    implements Builder<TableRowRoleInputDto, TableRowRoleInputDtoBuilder> {
  _$TableRowRoleInputDto? _$v;

  num? _row;
  num? get row => _$this._row;
  set row(num? row) => _$this._row = row;

  TableRowRoleInputDtoRoleEnum? _role;
  TableRowRoleInputDtoRoleEnum? get role => _$this._role;
  set role(TableRowRoleInputDtoRoleEnum? role) => _$this._role = role;

  TableRowRoleInputDtoBuilder() {
    TableRowRoleInputDto._defaults(this);
  }

  TableRowRoleInputDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _row = $v.row;
      _role = $v.role;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(TableRowRoleInputDto other) {
    _$v = other as _$TableRowRoleInputDto;
  }

  @override
  void update(void Function(TableRowRoleInputDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  TableRowRoleInputDto build() => _build();

  _$TableRowRoleInputDto _build() {
    final _$result = _$v ??
        _$TableRowRoleInputDto._(
          row: BuiltValueNullFieldError.checkNotNull(
              row, r'TableRowRoleInputDto', 'row'),
          role: BuiltValueNullFieldError.checkNotNull(
              role, r'TableRowRoleInputDto', 'role'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
