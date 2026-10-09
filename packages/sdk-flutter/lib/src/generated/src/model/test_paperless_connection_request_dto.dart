//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'test_paperless_connection_request_dto.g.dart';

/// TestPaperlessConnectionRequestDto
///
/// Properties:
/// * [credentials] 
@BuiltValue()
abstract class TestPaperlessConnectionRequestDto implements Built<TestPaperlessConnectionRequestDto, TestPaperlessConnectionRequestDtoBuilder> {
  @BuiltValueField(wireName: r'credentials')
  BuiltMap<String, String> get credentials;

  TestPaperlessConnectionRequestDto._();

  factory TestPaperlessConnectionRequestDto([void updates(TestPaperlessConnectionRequestDtoBuilder b)]) = _$TestPaperlessConnectionRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(TestPaperlessConnectionRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<TestPaperlessConnectionRequestDto> get serializer => _$TestPaperlessConnectionRequestDtoSerializer();
}

class _$TestPaperlessConnectionRequestDtoSerializer implements PrimitiveSerializer<TestPaperlessConnectionRequestDto> {
  @override
  final Iterable<Type> types = const [TestPaperlessConnectionRequestDto, _$TestPaperlessConnectionRequestDto];

  @override
  final String wireName = r'TestPaperlessConnectionRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    TestPaperlessConnectionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'credentials';
    yield serializers.serialize(
      object.credentials,
      specifiedType: const FullType(BuiltMap, [FullType(String), FullType(String)]),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    TestPaperlessConnectionRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required TestPaperlessConnectionRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'credentials':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltMap, [FullType(String), FullType(String)]),
          ) as BuiltMap<String, String>;
          result.credentials.replace(valueDes);
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  TestPaperlessConnectionRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = TestPaperlessConnectionRequestDtoBuilder();
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

