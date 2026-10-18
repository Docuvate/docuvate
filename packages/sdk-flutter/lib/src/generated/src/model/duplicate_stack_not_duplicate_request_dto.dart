//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'duplicate_stack_not_duplicate_request_dto.g.dart';

/// DuplicateStackNotDuplicateRequestDto
///
/// Properties:
/// * [otherDocumentId] 
@BuiltValue()
abstract class DuplicateStackNotDuplicateRequestDto implements Built<DuplicateStackNotDuplicateRequestDto, DuplicateStackNotDuplicateRequestDtoBuilder> {
  @BuiltValueField(wireName: r'otherDocumentId')
  String get otherDocumentId;

  DuplicateStackNotDuplicateRequestDto._();

  factory DuplicateStackNotDuplicateRequestDto([void updates(DuplicateStackNotDuplicateRequestDtoBuilder b)]) = _$DuplicateStackNotDuplicateRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DuplicateStackNotDuplicateRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DuplicateStackNotDuplicateRequestDto> get serializer => _$DuplicateStackNotDuplicateRequestDtoSerializer();
}

class _$DuplicateStackNotDuplicateRequestDtoSerializer implements PrimitiveSerializer<DuplicateStackNotDuplicateRequestDto> {
  @override
  final Iterable<Type> types = const [DuplicateStackNotDuplicateRequestDto, _$DuplicateStackNotDuplicateRequestDto];

  @override
  final String wireName = r'DuplicateStackNotDuplicateRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DuplicateStackNotDuplicateRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'otherDocumentId';
    yield serializers.serialize(
      object.otherDocumentId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DuplicateStackNotDuplicateRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DuplicateStackNotDuplicateRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'otherDocumentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.otherDocumentId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DuplicateStackNotDuplicateRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DuplicateStackNotDuplicateRequestDtoBuilder();
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

