// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'label_recommendation_blocklist_entry_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LabelRecommendationBlocklistEntryResponseDtoSource_Enum
    _$labelRecommendationBlocklistEntryResponseDtoSourceEnum_manual =
    const LabelRecommendationBlocklistEntryResponseDtoSource_Enum._('manual');
const LabelRecommendationBlocklistEntryResponseDtoSource_Enum
    _$labelRecommendationBlocklistEntryResponseDtoSourceEnum_dismiss =
    const LabelRecommendationBlocklistEntryResponseDtoSource_Enum._('dismiss');

LabelRecommendationBlocklistEntryResponseDtoSource_Enum
    _$labelRecommendationBlocklistEntryResponseDtoSourceEnumValueOf(
        String name) {
  switch (name) {
    case 'manual':
      return _$labelRecommendationBlocklistEntryResponseDtoSourceEnum_manual;
    case 'dismiss':
      return _$labelRecommendationBlocklistEntryResponseDtoSourceEnum_dismiss;
    default:
      throw ArgumentError(name);
  }
}

final BuiltSet<LabelRecommendationBlocklistEntryResponseDtoSource_Enum>
    _$labelRecommendationBlocklistEntryResponseDtoSourceEnumValues = BuiltSet<
        LabelRecommendationBlocklistEntryResponseDtoSource_Enum>(const <LabelRecommendationBlocklistEntryResponseDtoSource_Enum>[
  _$labelRecommendationBlocklistEntryResponseDtoSourceEnum_manual,
  _$labelRecommendationBlocklistEntryResponseDtoSourceEnum_dismiss,
]);

Serializer<LabelRecommendationBlocklistEntryResponseDtoSource_Enum>
    _$labelRecommendationBlocklistEntryResponseDtoSourceEnumSerializer =
    _$LabelRecommendationBlocklistEntryResponseDtoSource_EnumSerializer();

class _$LabelRecommendationBlocklistEntryResponseDtoSource_EnumSerializer
    implements
        PrimitiveSerializer<
            LabelRecommendationBlocklistEntryResponseDtoSource_Enum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'manual': 'manual',
    'dismiss': 'dismiss',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'manual': 'manual',
    'dismiss': 'dismiss',
  };

  @override
  final Iterable<Type> types = const <Type>[
    LabelRecommendationBlocklistEntryResponseDtoSource_Enum
  ];
  @override
  final String wireName =
      'LabelRecommendationBlocklistEntryResponseDtoSource_Enum';

  @override
  Object serialize(Serializers serializers,
          LabelRecommendationBlocklistEntryResponseDtoSource_Enum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  LabelRecommendationBlocklistEntryResponseDtoSource_Enum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      LabelRecommendationBlocklistEntryResponseDtoSource_Enum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$LabelRecommendationBlocklistEntryResponseDto
    extends LabelRecommendationBlocklistEntryResponseDto {
  @override
  final String id;
  @override
  final String phrase;
  @override
  final LabelRecommendationBlocklistEntryResponseDtoSource_Enum source_;
  @override
  final String createdAt;

  factory _$LabelRecommendationBlocklistEntryResponseDto(
          [void Function(LabelRecommendationBlocklistEntryResponseDtoBuilder)?
              updates]) =>
      (LabelRecommendationBlocklistEntryResponseDtoBuilder()..update(updates))
          ._build();

  _$LabelRecommendationBlocklistEntryResponseDto._(
      {required this.id,
      required this.phrase,
      required this.source_,
      required this.createdAt})
      : super._();
  @override
  LabelRecommendationBlocklistEntryResponseDto rebuild(
          void Function(LabelRecommendationBlocklistEntryResponseDtoBuilder)
              updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LabelRecommendationBlocklistEntryResponseDtoBuilder toBuilder() =>
      LabelRecommendationBlocklistEntryResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LabelRecommendationBlocklistEntryResponseDto &&
        id == other.id &&
        phrase == other.phrase &&
        source_ == other.source_ &&
        createdAt == other.createdAt;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, phrase.hashCode);
    _$hash = $jc(_$hash, source_.hashCode);
    _$hash = $jc(_$hash, createdAt.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(
            r'LabelRecommendationBlocklistEntryResponseDto')
          ..add('id', id)
          ..add('phrase', phrase)
          ..add('source_', source_)
          ..add('createdAt', createdAt))
        .toString();
  }
}

class LabelRecommendationBlocklistEntryResponseDtoBuilder
    implements
        Builder<LabelRecommendationBlocklistEntryResponseDto,
            LabelRecommendationBlocklistEntryResponseDtoBuilder> {
  _$LabelRecommendationBlocklistEntryResponseDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _phrase;
  String? get phrase => _$this._phrase;
  set phrase(String? phrase) => _$this._phrase = phrase;

  LabelRecommendationBlocklistEntryResponseDtoSource_Enum? _source_;
  LabelRecommendationBlocklistEntryResponseDtoSource_Enum? get source_ =>
      _$this._source_;
  set source_(
          LabelRecommendationBlocklistEntryResponseDtoSource_Enum? source_) =>
      _$this._source_ = source_;

  String? _createdAt;
  String? get createdAt => _$this._createdAt;
  set createdAt(String? createdAt) => _$this._createdAt = createdAt;

  LabelRecommendationBlocklistEntryResponseDtoBuilder() {
    LabelRecommendationBlocklistEntryResponseDto._defaults(this);
  }

  LabelRecommendationBlocklistEntryResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _phrase = $v.phrase;
      _source_ = $v.source_;
      _createdAt = $v.createdAt;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LabelRecommendationBlocklistEntryResponseDto other) {
    _$v = other as _$LabelRecommendationBlocklistEntryResponseDto;
  }

  @override
  void update(
      void Function(LabelRecommendationBlocklistEntryResponseDtoBuilder)?
          updates) {
    if (updates != null) updates(this);
  }

  @override
  LabelRecommendationBlocklistEntryResponseDto build() => _build();

  _$LabelRecommendationBlocklistEntryResponseDto _build() {
    final _$result = _$v ??
        _$LabelRecommendationBlocklistEntryResponseDto._(
          id: BuiltValueNullFieldError.checkNotNull(
              id, r'LabelRecommendationBlocklistEntryResponseDto', 'id'),
          phrase: BuiltValueNullFieldError.checkNotNull(phrase,
              r'LabelRecommendationBlocklistEntryResponseDto', 'phrase'),
          source_: BuiltValueNullFieldError.checkNotNull(source_,
              r'LabelRecommendationBlocklistEntryResponseDto', 'source_'),
          createdAt: BuiltValueNullFieldError.checkNotNull(createdAt,
              r'LabelRecommendationBlocklistEntryResponseDto', 'createdAt'),
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
