// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'label_recommendation_list_response_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

const LabelRecommendationListResponseDtoStateEnum
    _$labelRecommendationListResponseDtoStateEnum_ready =
    const LabelRecommendationListResponseDtoStateEnum._('ready');
const LabelRecommendationListResponseDtoStateEnum
    _$labelRecommendationListResponseDtoStateEnum_warming =
    const LabelRecommendationListResponseDtoStateEnum._('warming');

LabelRecommendationListResponseDtoStateEnum
    _$labelRecommendationListResponseDtoStateEnumValueOf(String name) {
  switch (name) {
    case 'ready':
      return _$labelRecommendationListResponseDtoStateEnum_ready;
    case 'warming':
      return _$labelRecommendationListResponseDtoStateEnum_warming;
    default:
      throw new ArgumentError(name);
  }
}

final BuiltSet<LabelRecommendationListResponseDtoStateEnum>
    _$labelRecommendationListResponseDtoStateEnumValues = new BuiltSet<
        LabelRecommendationListResponseDtoStateEnum>(const <LabelRecommendationListResponseDtoStateEnum>[
  _$labelRecommendationListResponseDtoStateEnum_ready,
  _$labelRecommendationListResponseDtoStateEnum_warming,
]);

Serializer<LabelRecommendationListResponseDtoStateEnum>
    _$labelRecommendationListResponseDtoStateEnumSerializer =
    new _$LabelRecommendationListResponseDtoStateEnumSerializer();

class _$LabelRecommendationListResponseDtoStateEnumSerializer
    implements
        PrimitiveSerializer<LabelRecommendationListResponseDtoStateEnum> {
  static const Map<String, Object> _toWire = const <String, Object>{
    'ready': 'ready',
    'warming': 'warming',
  };
  static const Map<Object, String> _fromWire = const <Object, String>{
    'ready': 'ready',
    'warming': 'warming',
  };

  @override
  final Iterable<Type> types = const <Type>[
    LabelRecommendationListResponseDtoStateEnum
  ];
  @override
  final String wireName = 'LabelRecommendationListResponseDtoStateEnum';

  @override
  Object serialize(Serializers serializers,
          LabelRecommendationListResponseDtoStateEnum object,
          {FullType specifiedType = FullType.unspecified}) =>
      _toWire[object.name] ?? object.name;

  @override
  LabelRecommendationListResponseDtoStateEnum deserialize(
          Serializers serializers, Object serialized,
          {FullType specifiedType = FullType.unspecified}) =>
      LabelRecommendationListResponseDtoStateEnum.valueOf(
          _fromWire[serialized] ?? (serialized is String ? serialized : ''));
}

class _$LabelRecommendationListResponseDto
    extends LabelRecommendationListResponseDto {
  @override
  final BuiltList<JsonObject> items;
  @override
  final LabelRecommendationListResponseDtoStateEnum state;

  factory _$LabelRecommendationListResponseDto(
          [void Function(LabelRecommendationListResponseDtoBuilder)?
              updates]) =>
      (new LabelRecommendationListResponseDtoBuilder()..update(updates))
          ._build();

  _$LabelRecommendationListResponseDto._(
      {required this.items, required this.state})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        items, r'LabelRecommendationListResponseDto', 'items');
    BuiltValueNullFieldError.checkNotNull(
        state, r'LabelRecommendationListResponseDto', 'state');
  }

  @override
  LabelRecommendationListResponseDto rebuild(
          void Function(LabelRecommendationListResponseDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  LabelRecommendationListResponseDtoBuilder toBuilder() =>
      new LabelRecommendationListResponseDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is LabelRecommendationListResponseDto &&
        items == other.items &&
        state == other.state;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, items.hashCode);
    _$hash = $jc(_$hash, state.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'LabelRecommendationListResponseDto')
          ..add('items', items)
          ..add('state', state))
        .toString();
  }
}

class LabelRecommendationListResponseDtoBuilder
    implements
        Builder<LabelRecommendationListResponseDto,
            LabelRecommendationListResponseDtoBuilder> {
  _$LabelRecommendationListResponseDto? _$v;

  ListBuilder<JsonObject>? _items;
  ListBuilder<JsonObject> get items =>
      _$this._items ??= new ListBuilder<JsonObject>();
  set items(ListBuilder<JsonObject>? items) => _$this._items = items;

  LabelRecommendationListResponseDtoStateEnum? _state;
  LabelRecommendationListResponseDtoStateEnum? get state => _$this._state;
  set state(LabelRecommendationListResponseDtoStateEnum? state) =>
      _$this._state = state;

  LabelRecommendationListResponseDtoBuilder() {
    LabelRecommendationListResponseDto._defaults(this);
  }

  LabelRecommendationListResponseDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _items = $v.items.toBuilder();
      _state = $v.state;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(LabelRecommendationListResponseDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$LabelRecommendationListResponseDto;
  }

  @override
  void update(
      void Function(LabelRecommendationListResponseDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  LabelRecommendationListResponseDto build() => _build();

  _$LabelRecommendationListResponseDto _build() {
    _$LabelRecommendationListResponseDto _$result;
    try {
      _$result = _$v ??
          new _$LabelRecommendationListResponseDto._(
              items: items.build(),
              state: BuiltValueNullFieldError.checkNotNull(
                  state, r'LabelRecommendationListResponseDto', 'state'));
    } catch (_) {
      late String _$failedField;
      try {
        _$failedField = 'items';
        items.build();
      } catch (e) {
        throw new BuiltValueNestedFieldError(
            r'LabelRecommendationListResponseDto', _$failedField, e.toString());
      }
      rethrow;
    }
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
