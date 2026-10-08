//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'dismiss_tag_suggestion_request_dto.g.dart';

/// DismissTagSuggestionRequestDto
///
/// Properties:
/// * [blockFuture] 
@BuiltValue()
abstract class DismissTagSuggestionRequestDto implements Built<DismissTagSuggestionRequestDto, DismissTagSuggestionRequestDtoBuilder> {
  @BuiltValueField(wireName: r'blockFuture')
  bool? get blockFuture;

  DismissTagSuggestionRequestDto._();

  factory DismissTagSuggestionRequestDto([void updates(DismissTagSuggestionRequestDtoBuilder b)]) = _$DismissTagSuggestionRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DismissTagSuggestionRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DismissTagSuggestionRequestDto> get serializer => _$DismissTagSuggestionRequestDtoSerializer();
}

class _$DismissTagSuggestionRequestDtoSerializer implements PrimitiveSerializer<DismissTagSuggestionRequestDto> {
  @override
  final Iterable<Type> types = const [DismissTagSuggestionRequestDto, _$DismissTagSuggestionRequestDto];

  @override
  final String wireName = r'DismissTagSuggestionRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DismissTagSuggestionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.blockFuture != null) {
      yield r'blockFuture';
      yield serializers.serialize(
        object.blockFuture,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    DismissTagSuggestionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DismissTagSuggestionRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'blockFuture':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.blockFuture = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DismissTagSuggestionRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DismissTagSuggestionRequestDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

