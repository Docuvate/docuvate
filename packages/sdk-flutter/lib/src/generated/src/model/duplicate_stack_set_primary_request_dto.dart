//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'duplicate_stack_set_primary_request_dto.g.dart';

/// DuplicateStackSetPrimaryRequestDto
///
/// Properties:
/// * [documentId] 
/// * [stackId] 
@BuiltValue()
abstract class DuplicateStackSetPrimaryRequestDto implements Built<DuplicateStackSetPrimaryRequestDto, DuplicateStackSetPrimaryRequestDtoBuilder> {
  @BuiltValueField(wireName: r'documentId')
  String get documentId;

  @BuiltValueField(wireName: r'stackId')
  String get stackId;

  DuplicateStackSetPrimaryRequestDto._();

  factory DuplicateStackSetPrimaryRequestDto([void updates(DuplicateStackSetPrimaryRequestDtoBuilder b)]) = _$DuplicateStackSetPrimaryRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(DuplicateStackSetPrimaryRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<DuplicateStackSetPrimaryRequestDto> get serializer => _$DuplicateStackSetPrimaryRequestDtoSerializer();
}

class _$DuplicateStackSetPrimaryRequestDtoSerializer implements PrimitiveSerializer<DuplicateStackSetPrimaryRequestDto> {
  @override
  final Iterable<Type> types = const [DuplicateStackSetPrimaryRequestDto, _$DuplicateStackSetPrimaryRequestDto];

  @override
  final String wireName = r'DuplicateStackSetPrimaryRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    DuplicateStackSetPrimaryRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'documentId';
    yield serializers.serialize(
      object.documentId,
      specifiedType: const FullType(String),
    );
    yield r'stackId';
    yield serializers.serialize(
      object.stackId,
      specifiedType: const FullType(String),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    DuplicateStackSetPrimaryRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required DuplicateStackSetPrimaryRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'documentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentId = valueDes;
          break;
        case r'stackId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.stackId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  DuplicateStackSetPrimaryRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = DuplicateStackSetPrimaryRequestDtoBuilder();
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

