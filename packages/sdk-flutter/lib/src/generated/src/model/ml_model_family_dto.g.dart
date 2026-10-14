// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ml_model_family_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const MlModelFamilyDtoKindEnum _$mlModelFamilyDtoKindEnum_embedding =
    const MlModelFamilyDtoKindEnum._('embedding');
const MlModelFamilyDtoKindEnum _$mlModelFamilyDtoKindEnum_ocr =
    const MlModelFamilyDtoKindEnum._('ocr');
const MlModelFamilyDtoKindEnum _$mlModelFamilyDtoKindEnum_docqa =
    const MlModelFamilyDtoKindEnum._('docqa');
const MlModelFamilyDtoKindEnum _$mlModelFamilyDtoKindEnum_fieldExtractor =
    const MlModelFamilyDtoKindEnum._('fieldExtractor');

MlModelFamilyDtoKindEnum _$mlModelFamilyDtoKindEnumValueOf(String name) {
  switch (name) {
    case 'embedding':
      return _$mlModelFamilyDtoKindEnum_embedding;
    case 'ocr':
      return _$mlModelFamilyDtoKindEnum_ocr;
    case 'docqa':
      return _$mlModelFamilyDtoKindEnum_docqa;
    case 'fieldExtractor':
      return _$mlModelFamilyDtoKindEnum_fieldExtractor;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<MlModelFamilyDtoKindEnum> _$mlModelFamilyDtoKindEnumValues =
    BuiltSet<MlModelFamilyDtoKindEnum>(const <MlModelFamilyDtoKindEnum>[
  _$mlModelFamilyDtoKindEnum_embedding,
  _$mlModelFamilyDtoKindEnum_ocr,
  _$mlModelFamilyDtoKindEnum_docqa,
  _$mlModelFamilyDtoKindEnum_fieldExtractor,
]);

Serializer<MlModelFamilyDtoKindEnum> _$mlModelFamilyDtoKindEnumSerializer =
    _$MlModelFamilyDtoKindEnumSerializer();

class _$MlModelFamilyDtoKindEnumSerializer
    implements PrimitiveSerializer<MlModelFamilyDtoKindEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'embedding': 'embedding',
    'ocr': 'ocr',
    'docqa': 'docqa',
    'fieldExtractor': 'field_extractor',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'embedding': 'embedding',
    'ocr': 'ocr',
    'docqa': 'docqa',
    'field_extractor': 'fieldExtractor',
  };

  @override
  final Iterable<Type> types = const <Type>[MlModelFamilyDtoKindEnum];
  @override
  final String wireName = 'MlModelFamilyDtoKindEnum';

  @override
  Object serialize(Serializers serializers, MlModelFamilyDtoKindEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  MlModelFamilyDtoKindEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      MlModelFamilyDtoKindEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$MlModelFamilyDto extends MlModelFamilyDto {
  @override
  final String id;
  @override
  final MlModelFamilyDtoKindEnum kind;
  @override
  final String displayName;
  @override
  final String description;

  factory _$MlModelFamilyDto(
          [void Function(MlModelFamilyDtoBuilder)? updates]) =>
      (MlModelFamilyDtoBuilder()..update(updates))._build();

  _$MlModelFamilyDto._(
      {required this.id,
      required this.kind,
      required this.displayName,
      required this.description})
      : super._();
  @override
  MlModelFamilyDto rebuild(void Function(MlModelFamilyDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  MlModelFamilyDtoBuilder toBuilder() =>
      MlModelFamilyDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is MlModelFamilyDto &&
        id == other.id &&
        kind == other.kind &&
        displayName == other.displayName &&
        description == other.description;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, kind.hashCode);
    _$hash = $jc(_$hash, displayName.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'MlModelFamilyDto')
          ..add('id', id)
          ..add('kind', kind)
          ..add('displayName', displayName)
          ..add('description', description))
        .toString();
  }
}

class MlModelFamilyDtoBuilder
    implements Builder<MlModelFamilyDto, MlModelFamilyDtoBuilder> {
  _$MlModelFamilyDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  MlModelFamilyDtoKindEnum? _kind;
  MlModelFamilyDtoKindEnum? get kind => _$this._kind;
  set kind(MlModelFamilyDtoKindEnum? kind) => _$this._kind = kind;

  String? _displayName;
  String? get displayName => _$this._displayName;
  set displayName(String? displayName) => _$this._displayName = displayName;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  MlModelFamilyDtoBuilder() {
    MlModelFamilyDto._defaults(this);
  }

  MlModelFamilyDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _kind = $v.kind;
      _displayName = $v.displayName;
      _description = $v.description;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(MlModelFamilyDto other) {
    _$v = other as _$MlModelFamilyDto;
  }

  @override
  void update(void Function(MlModelFamilyDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  MlModelFamilyDto build() => _build();

  _$MlModelFamilyDto _build() {
    final _$result = _$v ??
        _$MlModelFamilyDto._(
          id: BuiltValueNullFieldError.checkNotNull(
              id, r'MlModelFamilyDto', 'id'),
          kind: BuiltValueNullFieldError.checkNotNull(
              kind, r'MlModelFamilyDto', 'kind'),
          displayName: BuiltValueNullFieldError.checkNotNull(
              displayName, r'MlModelFamilyDto', 'displayName'),
          description: BuiltValueNullFieldError.checkNotNull(
              description, r'MlModelFamilyDto', 'description'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
