// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'replace_tag_custom_field_item_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ReplaceTagCustomFieldItemDtoFieldTypeEnum
    _$replaceTagCustomFieldItemDtoFieldTypeEnum_text =
    const ReplaceTagCustomFieldItemDtoFieldTypeEnum._('text');
const ReplaceTagCustomFieldItemDtoFieldTypeEnum
    _$replaceTagCustomFieldItemDtoFieldTypeEnum_date =
    const ReplaceTagCustomFieldItemDtoFieldTypeEnum._('date');
const ReplaceTagCustomFieldItemDtoFieldTypeEnum
    _$replaceTagCustomFieldItemDtoFieldTypeEnum_number =
    const ReplaceTagCustomFieldItemDtoFieldTypeEnum._('number');
const ReplaceTagCustomFieldItemDtoFieldTypeEnum
    _$replaceTagCustomFieldItemDtoFieldTypeEnum_currency =
    const ReplaceTagCustomFieldItemDtoFieldTypeEnum._('currency');

ReplaceTagCustomFieldItemDtoFieldTypeEnum
    _$replaceTagCustomFieldItemDtoFieldTypeEnumValueOf(String name) {
  switch (name) {
    case 'text':
      return _$replaceTagCustomFieldItemDtoFieldTypeEnum_text;
    case 'date':
      return _$replaceTagCustomFieldItemDtoFieldTypeEnum_date;
    case 'number':
      return _$replaceTagCustomFieldItemDtoFieldTypeEnum_number;
    case 'currency':
      return _$replaceTagCustomFieldItemDtoFieldTypeEnum_currency;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<ReplaceTagCustomFieldItemDtoFieldTypeEnum>
    _$replaceTagCustomFieldItemDtoFieldTypeEnumValues = new BuiltSet<
        ReplaceTagCustomFieldItemDtoFieldTypeEnum>(const <ReplaceTagCustomFieldItemDtoFieldTypeEnum>[
  _$replaceTagCustomFieldItemDtoFieldTypeEnum_text,
  _$replaceTagCustomFieldItemDtoFieldTypeEnum_date,
  _$replaceTagCustomFieldItemDtoFieldTypeEnum_number,
  _$replaceTagCustomFieldItemDtoFieldTypeEnum_currency,
]);

Serializer<ReplaceTagCustomFieldItemDtoFieldTypeEnum>
    _$replaceTagCustomFieldItemDtoFieldTypeEnumSerializer =
    new _$ReplaceTagCustomFieldItemDtoFieldTypeEnumSerializer();

class _$ReplaceTagCustomFieldItemDtoFieldTypeEnumSerializer
    implements PrimitiveSerializer<ReplaceTagCustomFieldItemDtoFieldTypeEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'text': 'text',
    'date': 'date',
    'number': 'number',
    'currency': 'currency',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'text': 'text',
    'date': 'date',
    'number': 'number',
    'currency': 'currency',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ReplaceTagCustomFieldItemDtoFieldTypeEnum
  ];
  @override
  final String wireName = 'ReplaceTagCustomFieldItemDtoFieldTypeEnum';

  @override
  Object serialize(Serializers serializers,
          ReplaceTagCustomFieldItemDtoFieldTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ReplaceTagCustomFieldItemDtoFieldTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ReplaceTagCustomFieldItemDtoFieldTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ReplaceTagCustomFieldItemDto extends ReplaceTagCustomFieldItemDto {
  @override
  final String key;
  @override
  final String label;
  @override
  final ReplaceTagCustomFieldItemDtoFieldTypeEnum? fieldType;
  @override
  final num? sortOrder;

  factory _$ReplaceTagCustomFieldItemDto(
          [void Function(ReplaceTagCustomFieldItemDtoBuilder)? updates]) =>
      (new ReplaceTagCustomFieldItemDtoBuilder()..update(updates))._build();

  _$ReplaceTagCustomFieldItemDto._(
      {required this.key, required this.label, this.fieldType, this.sortOrder})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        key, r'ReplaceTagCustomFieldItemDto', 'key');
    BuiltValueNullFieldError.checkNotNull(
        label, r'ReplaceTagCustomFieldItemDto', 'label');
  }

  @override
  ReplaceTagCustomFieldItemDto rebuild(
          void Function(ReplaceTagCustomFieldItemDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReplaceTagCustomFieldItemDtoBuilder toBuilder() =>
      new ReplaceTagCustomFieldItemDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReplaceTagCustomFieldItemDto &&
        key == other.key &&
        label == other.label &&
        fieldType == other.fieldType &&
        sortOrder == other.sortOrder;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, key.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, fieldType.hashCode);
    _$hash = $jc(_$hash, sortOrder.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReplaceTagCustomFieldItemDto')
          ..add('key', key)
          ..add('label', label)
          ..add('fieldType', fieldType)
          ..add('sortOrder', sortOrder))
        .toString();
  }
}

class ReplaceTagCustomFieldItemDtoBuilder
    implements
        Builder<ReplaceTagCustomFieldItemDto,
            ReplaceTagCustomFieldItemDtoBuilder> {
  _$ReplaceTagCustomFieldItemDto? _$v;

  String? _key;
  String? get key => _$this._key;
  set key(String? key) => _$this._key = key;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  ReplaceTagCustomFieldItemDtoFieldTypeEnum? _fieldType;
  ReplaceTagCustomFieldItemDtoFieldTypeEnum? get fieldType => _$this._fieldType;
  set fieldType(ReplaceTagCustomFieldItemDtoFieldTypeEnum? fieldType) =>
      _$this._fieldType = fieldType;

  num? _sortOrder;
  num? get sortOrder => _$this._sortOrder;
  set sortOrder(num? sortOrder) => _$this._sortOrder = sortOrder;

  ReplaceTagCustomFieldItemDtoBuilder() {
    ReplaceTagCustomFieldItemDto._defaults(this);
  }

  ReplaceTagCustomFieldItemDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _key = $v.key;
      _label = $v.label;
      _fieldType = $v.fieldType;
      _sortOrder = $v.sortOrder;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReplaceTagCustomFieldItemDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$ReplaceTagCustomFieldItemDto;
  }

  @override
  void update(void Function(ReplaceTagCustomFieldItemDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReplaceTagCustomFieldItemDto build() => _build();

  _$ReplaceTagCustomFieldItemDto _build() {
    final _$result = _$v ??
        new _$ReplaceTagCustomFieldItemDto._(
            key: BuiltValueNullFieldError.checkNotNull(
                key, r'ReplaceTagCustomFieldItemDto', 'key'),
            label: BuiltValueNullFieldError.checkNotNull(
                label, r'ReplaceTagCustomFieldItemDto', 'label'),
            fieldType: fieldType,
            sortOrder: sortOrder);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
