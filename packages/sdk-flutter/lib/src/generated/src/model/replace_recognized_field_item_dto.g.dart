// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'replace_recognized_field_item_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const ReplaceRecognizedFieldItemDtoFieldTypeEnum
    _$replaceRecognizedFieldItemDtoFieldTypeEnum_text =
    const ReplaceRecognizedFieldItemDtoFieldTypeEnum._('text');
const ReplaceRecognizedFieldItemDtoFieldTypeEnum
    _$replaceRecognizedFieldItemDtoFieldTypeEnum_date =
    const ReplaceRecognizedFieldItemDtoFieldTypeEnum._('date');
const ReplaceRecognizedFieldItemDtoFieldTypeEnum
    _$replaceRecognizedFieldItemDtoFieldTypeEnum_number =
    const ReplaceRecognizedFieldItemDtoFieldTypeEnum._('number');
const ReplaceRecognizedFieldItemDtoFieldTypeEnum
    _$replaceRecognizedFieldItemDtoFieldTypeEnum_currency =
    const ReplaceRecognizedFieldItemDtoFieldTypeEnum._('currency');

ReplaceRecognizedFieldItemDtoFieldTypeEnum
    _$replaceRecognizedFieldItemDtoFieldTypeEnumValueOf(String name) {
  switch (name) {
    case 'text':
      return _$replaceRecognizedFieldItemDtoFieldTypeEnum_text;
    case 'date':
      return _$replaceRecognizedFieldItemDtoFieldTypeEnum_date;
    case 'number':
      return _$replaceRecognizedFieldItemDtoFieldTypeEnum_number;
    case 'currency':
      return _$replaceRecognizedFieldItemDtoFieldTypeEnum_currency;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ReplaceRecognizedFieldItemDtoFieldTypeEnum>
    _$replaceRecognizedFieldItemDtoFieldTypeEnumValues = BuiltSet<
        ReplaceRecognizedFieldItemDtoFieldTypeEnum>(const <ReplaceRecognizedFieldItemDtoFieldTypeEnum>[
  _$replaceRecognizedFieldItemDtoFieldTypeEnum_text,
  _$replaceRecognizedFieldItemDtoFieldTypeEnum_date,
  _$replaceRecognizedFieldItemDtoFieldTypeEnum_number,
  _$replaceRecognizedFieldItemDtoFieldTypeEnum_currency,
]);

const ReplaceRecognizedFieldItemDtoGateLabelMatchEnum
    _$replaceRecognizedFieldItemDtoGateLabelMatchEnum_any =
    const ReplaceRecognizedFieldItemDtoGateLabelMatchEnum._('any');
const ReplaceRecognizedFieldItemDtoGateLabelMatchEnum
    _$replaceRecognizedFieldItemDtoGateLabelMatchEnum_all =
    const ReplaceRecognizedFieldItemDtoGateLabelMatchEnum._('all');

ReplaceRecognizedFieldItemDtoGateLabelMatchEnum
    _$replaceRecognizedFieldItemDtoGateLabelMatchEnumValueOf(String name) {
  switch (name) {
    case 'any':
      return _$replaceRecognizedFieldItemDtoGateLabelMatchEnum_any;
    case 'all':
      return _$replaceRecognizedFieldItemDtoGateLabelMatchEnum_all;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<ReplaceRecognizedFieldItemDtoGateLabelMatchEnum>
    _$replaceRecognizedFieldItemDtoGateLabelMatchEnumValues = BuiltSet<
        ReplaceRecognizedFieldItemDtoGateLabelMatchEnum>(const <ReplaceRecognizedFieldItemDtoGateLabelMatchEnum>[
  _$replaceRecognizedFieldItemDtoGateLabelMatchEnum_any,
  _$replaceRecognizedFieldItemDtoGateLabelMatchEnum_all,
]);

Serializer<ReplaceRecognizedFieldItemDtoFieldTypeEnum>
    _$replaceRecognizedFieldItemDtoFieldTypeEnumSerializer =
    _$ReplaceRecognizedFieldItemDtoFieldTypeEnumSerializer();
Serializer<ReplaceRecognizedFieldItemDtoGateLabelMatchEnum>
    _$replaceRecognizedFieldItemDtoGateLabelMatchEnumSerializer =
    _$ReplaceRecognizedFieldItemDtoGateLabelMatchEnumSerializer();

class _$ReplaceRecognizedFieldItemDtoFieldTypeEnumSerializer
    implements PrimitiveSerializer<ReplaceRecognizedFieldItemDtoFieldTypeEnum> {
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
    ReplaceRecognizedFieldItemDtoFieldTypeEnum
  ];
  @override
  final String wireName = 'ReplaceRecognizedFieldItemDtoFieldTypeEnum';

  @override
  Object serialize(Serializers serializers,
          ReplaceRecognizedFieldItemDtoFieldTypeEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ReplaceRecognizedFieldItemDtoFieldTypeEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ReplaceRecognizedFieldItemDtoFieldTypeEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ReplaceRecognizedFieldItemDtoGateLabelMatchEnumSerializer
    implements
        PrimitiveSerializer<ReplaceRecognizedFieldItemDtoGateLabelMatchEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'any': 'any',
    'all': 'all',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'any': 'any',
    'all': 'all',
  };

  @override
  final Iterable<Type> types = const <Type>[
    ReplaceRecognizedFieldItemDtoGateLabelMatchEnum
  ];
  @override
  final String wireName = 'ReplaceRecognizedFieldItemDtoGateLabelMatchEnum';

  @override
  Object serialize(Serializers serializers,
          ReplaceRecognizedFieldItemDtoGateLabelMatchEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  ReplaceRecognizedFieldItemDtoGateLabelMatchEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      ReplaceRecognizedFieldItemDtoGateLabelMatchEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$ReplaceRecognizedFieldItemDto extends ReplaceRecognizedFieldItemDto {
  @override
  final String key;
  @override
  final String label;
  @override
  final ReplaceRecognizedFieldItemDtoFieldTypeEnum? fieldType;
  @override
  final num? sortOrder;
  @override
  final bool? extractForAllDocuments;
  @override
  final BuiltList<String>? gateLabelIds;
  @override
  final ReplaceRecognizedFieldItemDtoGateLabelMatchEnum? gateLabelMatch;
  @override
  final num? minLabelConfidence;
  @override
  final bool? confidenceGateEnabled;

  factory _$ReplaceRecognizedFieldItemDto(
          [void Function(ReplaceRecognizedFieldItemDtoBuilder)? updates]) =>
      (ReplaceRecognizedFieldItemDtoBuilder()..update(updates))._build();

  _$ReplaceRecognizedFieldItemDto._(
      {required this.key,
      required this.label,
      this.fieldType,
      this.sortOrder,
      this.extractForAllDocuments,
      this.gateLabelIds,
      this.gateLabelMatch,
      this.minLabelConfidence,
      this.confidenceGateEnabled})
      : super._();
  @override
  ReplaceRecognizedFieldItemDto rebuild(
          void Function(ReplaceRecognizedFieldItemDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  ReplaceRecognizedFieldItemDtoBuilder toBuilder() =>
      ReplaceRecognizedFieldItemDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is ReplaceRecognizedFieldItemDto &&
        key == other.key &&
        label == other.label &&
        fieldType == other.fieldType &&
        sortOrder == other.sortOrder &&
        extractForAllDocuments == other.extractForAllDocuments &&
        gateLabelIds == other.gateLabelIds &&
        gateLabelMatch == other.gateLabelMatch &&
        minLabelConfidence == other.minLabelConfidence &&
        confidenceGateEnabled == other.confidenceGateEnabled;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, key.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, fieldType.hashCode);
    _$hash = $jc(_$hash, sortOrder.hashCode);
    _$hash = $jc(_$hash, extractForAllDocuments.hashCode);
    _$hash = $jc(_$hash, gateLabelIds.hashCode);
    _$hash = $jc(_$hash, gateLabelMatch.hashCode);
    _$hash = $jc(_$hash, minLabelConfidence.hashCode);
    _$hash = $jc(_$hash, confidenceGateEnabled.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'ReplaceRecognizedFieldItemDto')
          ..add('key', key)
          ..add('label', label)
          ..add('fieldType', fieldType)
          ..add('sortOrder', sortOrder)
          ..add('extractForAllDocuments', extractForAllDocuments)
          ..add('gateLabelIds', gateLabelIds)
          ..add('gateLabelMatch', gateLabelMatch)
          ..add('minLabelConfidence', minLabelConfidence)
          ..add('confidenceGateEnabled', confidenceGateEnabled))
        .toString();
  }
}

class ReplaceRecognizedFieldItemDtoBuilder
    implements
        Builder<ReplaceRecognizedFieldItemDto,
            ReplaceRecognizedFieldItemDtoBuilder> {
  _$ReplaceRecognizedFieldItemDto? _$v;

  String? _key;
  String? get key => _$this._key;
  set key(String? key) => _$this._key = key;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  ReplaceRecognizedFieldItemDtoFieldTypeEnum? _fieldType;
  ReplaceRecognizedFieldItemDtoFieldTypeEnum? get fieldType =>
      _$this._fieldType;
  set fieldType(ReplaceRecognizedFieldItemDtoFieldTypeEnum? fieldType) =>
      _$this._fieldType = fieldType;

  num? _sortOrder;
  num? get sortOrder => _$this._sortOrder;
  set sortOrder(num? sortOrder) => _$this._sortOrder = sortOrder;

  bool? _extractForAllDocuments;
  bool? get extractForAllDocuments => _$this._extractForAllDocuments;
  set extractForAllDocuments(bool? extractForAllDocuments) =>
      _$this._extractForAllDocuments = extractForAllDocuments;

  ListBuilder<String>? _gateLabelIds;
  ListBuilder<String> get gateLabelIds =>
      _$this._gateLabelIds ??= ListBuilder<String>();
  set gateLabelIds(ListBuilder<String>? gateLabelIds) =>
      _$this._gateLabelIds = gateLabelIds;

  ReplaceRecognizedFieldItemDtoGateLabelMatchEnum? _gateLabelMatch;
  ReplaceRecognizedFieldItemDtoGateLabelMatchEnum? get gateLabelMatch =>
      _$this._gateLabelMatch;
  set gateLabelMatch(
          ReplaceRecognizedFieldItemDtoGateLabelMatchEnum? gateLabelMatch) =>
      _$this._gateLabelMatch = gateLabelMatch;

  num? _minLabelConfidence;
  num? get minLabelConfidence => _$this._minLabelConfidence;
  set minLabelConfidence(num? minLabelConfidence) =>
      _$this._minLabelConfidence = minLabelConfidence;

  bool? _confidenceGateEnabled;
  bool? get confidenceGateEnabled => _$this._confidenceGateEnabled;
  set confidenceGateEnabled(bool? confidenceGateEnabled) =>
      _$this._confidenceGateEnabled = confidenceGateEnabled;

  ReplaceRecognizedFieldItemDtoBuilder() {
    ReplaceRecognizedFieldItemDto._defaults(this);
  }

  ReplaceRecognizedFieldItemDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _key = $v.key;
      _label = $v.label;
      _fieldType = $v.fieldType;
      _sortOrder = $v.sortOrder;
      _extractForAllDocuments = $v.extractForAllDocuments;
      _gateLabelIds = $v.gateLabelIds?.toBuilder();
      _gateLabelMatch = $v.gateLabelMatch;
      _minLabelConfidence = $v.minLabelConfidence;
      _confidenceGateEnabled = $v.confidenceGateEnabled;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(ReplaceRecognizedFieldItemDto other) {
    _$v = other as _$ReplaceRecognizedFieldItemDto;
  }

  @override
  void update(void Function(ReplaceRecognizedFieldItemDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  ReplaceRecognizedFieldItemDto build() => _build();

  _$ReplaceRecognizedFieldItemDto _build() {
    _$ReplaceRecognizedFieldItemDto _$result;
    try {
      _$result = _$v ??
          _$ReplaceRecognizedFieldItemDto._(
            key: BuiltValueNullFieldError.checkNotNull(
                key, r'ReplaceRecognizedFieldItemDto', 'key'),
            label: BuiltValueNullFieldError.checkNotNull(
                label, r'ReplaceRecognizedFieldItemDto', 'label'),
            fieldType: fieldType,
            sortOrder: sortOrder,
            extractForAllDocuments: extractForAllDocuments,
            gateLabelIds: _gateLabelIds?.build(),
            gateLabelMatch: gateLabelMatch,
            minLabelConfidence: minLabelConfidence,
            confidenceGateEnabled: confidenceGateEnabled,
          );
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'gateLabelIds';
        _gateLabelIds?.build();
      } catch (e) {
        throw BuiltValueNestedFieldError(
            r'ReplaceRecognizedFieldItemDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
